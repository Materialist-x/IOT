namespace V7Backend.Services;

public interface ITransportClient : IAsyncDisposable
{
    bool IsConnected { get; }
    Task ConnectAsync(string host, int port, CancellationToken cancellationToken);
    Task<byte[]> SendAsync(byte[] request, CancellationToken cancellationToken);
}
