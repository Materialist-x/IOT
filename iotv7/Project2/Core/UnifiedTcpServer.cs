using System;
using System.Net;
using System.Net.Sockets;
using System.Threading;
using System.Threading.Tasks;
using Project2.Logging;
using Project2.Models;

namespace Project2.Core
{
    public sealed class UnifiedTcpServer
    {
        private readonly SessionManager _sessionManager;
        private readonly IChannelQueue _channelQueue;
        private readonly LicenseService _licenseService;
        private readonly TenantResolver _tenantResolver;
        private readonly BillingEngine _billingEngine;
        private readonly ILogger _logger;
        private TcpListener _listener;

        public UnifiedTcpServer(
            SessionManager sessionManager,
            IChannelQueue channelQueue,
            LicenseService licenseService,
            TenantResolver tenantResolver,
            BillingEngine billingEngine,
            ILogger logger)
        {
            _sessionManager = sessionManager;
            _channelQueue = channelQueue;
            _licenseService = licenseService;
            _tenantResolver = tenantResolver;
            _billingEngine = billingEngine;
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
            var tenantId = "unresolved";
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
                        var identity = _tenantResolver.Resolve(tcpIdentity, payload);
                        tenantId = identity.TenantId;
                        deviceId = identity.DeviceId;

                        if (session == null)
                        {
                            if (!_tenantResolver.IsTenantActive(tenantId) ||
                                !_licenseService.CheckOnConnect(tenantId, deviceId) ||
                                !_billingEngine.TryRegisterDevice(tenantId, deviceId))
                            {
                                client.Close();
                                return;
                            }

                            session = _sessionManager.Register(tenantId, deviceId, client);
                            _billingEngine.ConnectionOpened(tenantId);
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
                    _billingEngine.ConnectionClosed(tenantId);
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
    }
}
