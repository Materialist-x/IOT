using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Sockets;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Script.Serialization;
using Project2.Logging;
using Project2.Models;

namespace Project2.Core
{
    public sealed class UnifiedTcpServer
    {
        private readonly SessionManager _sessionManager;
        private readonly IChannelQueue _channelQueue;
        private readonly ILogger _logger;
        private TcpListener _listener;

        public UnifiedTcpServer(
            SessionManager sessionManager,
            IChannelQueue channelQueue,
            ILogger logger)
        {
            _sessionManager = sessionManager;
            _channelQueue = channelQueue;
            _logger = logger;
        }

        public async Task StartAsync(IPAddress address, int port, CancellationToken cancellationToken)
        {
            _listener = new TcpListener(address, port);
            _listener.Start();
            _logger.Info("UnifiedTcpServer listening on " + address + ":" + port);

            using (cancellationToken.Register(() => _listener.Stop()))
            {
                while (!cancellationToken.IsCancellationRequested)
                {
                    TcpClient client;
                    try
                    {
                        client = await _listener.AcceptTcpClientAsync().ConfigureAwait(false);
                    }
                    catch (ObjectDisposedException)
                    {
                        break;
                    }
                    catch (SocketException) when (cancellationToken.IsCancellationRequested)
                    {
                        break;
                    }

                    var readTask = Task.Run(() => ReadLoopAsync(client, cancellationToken), cancellationToken);
                    if (readTask.IsCompleted)
                    {
                        _logger.Warn("TCP read task completed immediately.");
                    }
                }
            }
        }

        private async Task ReadLoopAsync(TcpClient client, CancellationToken cancellationToken)
        {
            var tcpIdentity = ExtractTcpIdentity(client);
            DeviceSession session = null;
            var tenantId = "default";
            var deviceId = tcpIdentity.RemoteEndpointKey;

            try
            {
                using (client)
                {
                    var stream = client.GetStream();
                    var buffer = new byte[8192];

                    while (!cancellationToken.IsCancellationRequested && client.Connected)
                    {
                        var bytesRead = await stream.ReadAsync(buffer, 0, buffer.Length, cancellationToken)
                            .ConfigureAwait(false);
                        if (bytesRead == 0)
                        {
                            break;
                        }

                        var payload = new byte[bytesRead];
                        Buffer.BlockCopy(buffer, 0, payload, 0, bytesRead);
                        ApplyPayloadIdentity(payload, ref tenantId, ref deviceId);

                        if (session == null)
                        {
                            session = _sessionManager.Register(tenantId, deviceId, client);
                        }

                        var message = new IncomingTcpMessage(
                            tenantId,
                            deviceId,
                            session.SessionId,
                            payload,
                            DetectMessageKind(payload),
                            DateTime.UtcNow);

                        _channelQueue.Enqueue(message);
                    }
                }
            }
            catch (OperationCanceledException)
            {
            }
            catch (Exception ex)
            {
                _logger.Error("TCP read loop failed for tenant/device " + tenantId + "/" + deviceId, ex);
            }
            finally
            {
                if (session != null)
                {
                    _sessionManager.MarkOffline(tenantId, deviceId);
                    _channelQueue.StopDevice(tenantId, deviceId);
                }
            }
        }

        private static TcpIdentity ExtractTcpIdentity(TcpClient client)
        {
            var endpoint = client.Client.RemoteEndPoint == null
                ? Guid.NewGuid().ToString("N")
                : client.Client.RemoteEndPoint.ToString();

            return new TcpIdentity(null, null, endpoint.Replace(":", "_"));
        }

        private static MessageKind DetectMessageKind(byte[] payload)
        {
            if (payload.Length <= 16)
            {
                var text = System.Text.Encoding.ASCII.GetString(payload).Trim();
                if (string.Equals(text, "PING", StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(text, "HEARTBEAT", StringComparison.OrdinalIgnoreCase))
                {
                    return MessageKind.Heartbeat;
                }

                if (string.Equals(text, "ALARM", StringComparison.OrdinalIgnoreCase))
                {
                    return MessageKind.Alarm;
                }
            }

            return MessageKind.Data;
        }

        private static void ApplyPayloadIdentity(byte[] payload, ref string tenantId, ref string deviceId)
        {
            if (payload == null || payload.Length == 0 || payload[0] != (byte)'{')
            {
                return;
            }

            try
            {
                var json = System.Text.Encoding.UTF8.GetString(payload);
                var serializer = new JavaScriptSerializer();
                var envelope = serializer.Deserialize<Dictionary<string, object>>(json);

                object value;
                if (envelope.TryGetValue("tenantId", out value) || envelope.TryGetValue("TenantId", out value))
                {
                    var nextTenant = Convert.ToString(value);
                    if (!string.IsNullOrWhiteSpace(nextTenant))
                    {
                        tenantId = nextTenant;
                    }
                }

                if (envelope.TryGetValue("deviceId", out value) || envelope.TryGetValue("DeviceId", out value))
                {
                    var nextDevice = Convert.ToString(value);
                    if (!string.IsNullOrWhiteSpace(nextDevice))
                    {
                        deviceId = nextDevice;
                    }
                }
            }
            catch
            {
                // Identity extraction is best-effort. Protocol parsers own payload validation.
            }
        }
    }
}
