using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Hosting;

namespace V7Backend.Services;

public class LoopbackIoSimulatorService : BackgroundService
{
    public const int ModbusPort = 15020;
    public const int JsonPort = 15021;

    private TcpListener? _modbusListener;
    private TcpListener? _jsonListener;
    private readonly Random _random = new();

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _modbusListener = new TcpListener(IPAddress.Loopback, ModbusPort);
        _jsonListener = new TcpListener(IPAddress.Loopback, JsonPort);
        _modbusListener.Start();
        _jsonListener.Start();

        var modbusTask = AcceptLoopAsync(_modbusListener, HandleModbusClientAsync, stoppingToken);
        var jsonTask = AcceptLoopAsync(_jsonListener, HandleJsonClientAsync, stoppingToken);

        await Task.WhenAll(modbusTask, jsonTask);
    }

    public override Task StopAsync(CancellationToken cancellationToken)
    {
        _modbusListener?.Stop();
        _jsonListener?.Stop();
        return base.StopAsync(cancellationToken);
    }

    private async Task AcceptLoopAsync(TcpListener listener, Func<TcpClient, CancellationToken, Task> handler, CancellationToken cancellationToken)
    {
        while (!cancellationToken.IsCancellationRequested)
        {
            TcpClient? client = null;
            try
            {
                client = await listener.AcceptTcpClientAsync(cancellationToken);
                _ = Task.Run(() => handler(client, cancellationToken), cancellationToken);
            }
            catch (OperationCanceledException)
            {
                client?.Dispose();
                break;
            }
            catch
            {
                client?.Dispose();
            }
        }
    }

    private async Task HandleModbusClientAsync(TcpClient client, CancellationToken cancellationToken)
    {
        using (client)
        {
            using var stream = client.GetStream();
            var buffer = new byte[256];

            while (!cancellationToken.IsCancellationRequested)
            {
                var length = await stream.ReadAsync(buffer, cancellationToken);
                if (length <= 0)
                {
                    break;
                }

                var request = buffer[..length];
                var address = request.Length >= 10 ? (ushort)((request[8] << 8) | request[9]) : (ushort)40010;
                var value = address % 2 == 0
                    ? (ushort)Math.Round((48 + _random.NextDouble() * 20) * 10)
                    : (ushort)Math.Round((1.1 + _random.NextDouble() * 0.7) * 100);

                var response = new byte[]
                {
                    request[0],
                    request[1],
                    0x00,
                    0x00,
                    0x00,
                    0x05,
                    request.Length > 6 ? request[6] : (byte)1,
                    0x03,
                    0x02,
                    (byte)(value >> 8),
                    (byte)(value & 0xFF)
                };

                await stream.WriteAsync(response, cancellationToken);
                await stream.FlushAsync(cancellationToken);
            }
        }
    }

    private async Task HandleJsonClientAsync(TcpClient client, CancellationToken cancellationToken)
    {
        using (client)
        {
            using var stream = client.GetStream();
            var buffer = new byte[1024];

            while (!cancellationToken.IsCancellationRequested)
            {
                var length = await stream.ReadAsync(buffer, cancellationToken);
                if (length <= 0)
                {
                    break;
                }

                var requestText = Encoding.UTF8.GetString(buffer, 0, length).Trim();
                var value = 42 + _random.NextDouble() * 26;

                try
                {
                    using var document = JsonDocument.Parse(requestText);
                    var tagName = document.RootElement.TryGetProperty("tag", out var tagProperty)
                        ? tagProperty.GetString()
                        : "Temp";
                    value = string.Equals(tagName, "Pressure", StringComparison.OrdinalIgnoreCase)
                        ? Math.Round(1.1 + _random.NextDouble() * 0.7, 2)
                        : Math.Round(42 + _random.NextDouble() * 26, 1);
                }
                catch
                {
                    value = Math.Round(42 + _random.NextDouble() * 26, 1);
                }

                var response = JsonSerializer.SerializeToUtf8Bytes(new
                {
                    value
                });
                await stream.WriteAsync(response, cancellationToken);
                await stream.FlushAsync(cancellationToken);
            }
        }
    }
}
