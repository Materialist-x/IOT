using System.Net.Sockets;

namespace V7Backend.Services;

public class TcpTransportClient : ITransportClient
{
    private TcpClient? _client;
    private NetworkStream? _stream;

    public bool IsConnected => _client is { Connected: true } && _stream is not null;

    public async Task ConnectAsync(string host, int port, CancellationToken cancellationToken)
    {
        if (IsConnected)
        {
            return;
        }

        await DisposeAsync();

        _client = new TcpClient();
        await _client.ConnectAsync(host, port, cancellationToken);
        _stream = _client.GetStream();
        _stream.ReadTimeout = 3000;
        _stream.WriteTimeout = 3000;
    }

    public async Task<byte[]> SendAsync(byte[] request, CancellationToken cancellationToken)
    {
        if (_stream is null)
        {
            throw new InvalidOperationException("TCP transport is not connected.");
        }

        await _stream.WriteAsync(request, cancellationToken);
        await _stream.FlushAsync(cancellationToken);

        var buffer = new byte[1024];
        var length = await _stream.ReadAsync(buffer, cancellationToken);
        return buffer[..length];
    }

    public ValueTask DisposeAsync()
    {
        try
        {
            _stream?.Dispose();
            _client?.Dispose();
        }
        finally
        {
            _stream = null;
            _client = null;
        }

        return ValueTask.CompletedTask;
    }
}
