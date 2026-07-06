using System.Collections.Concurrent;

namespace V7Backend.Services;

public class DeviceClientPool : IAsyncDisposable
{
    private readonly ConcurrentDictionary<string, ITransportClient> _clients = new(StringComparer.OrdinalIgnoreCase);

    public async Task<ITransportClient> GetOrCreateAsync(DeviceDto device, CancellationToken cancellationToken)
    {
        if (_clients.TryGetValue(device.Id, out var existing))
        {
            try
            {
                await existing.ConnectAsync(device.Host, device.Port, cancellationToken);
                return existing;
            }
            catch
            {
                await RemoveAsync(device.Id);
            }
        }

        var created = new TcpTransportClient();
        await created.ConnectAsync(device.Host, device.Port, cancellationToken);
        _clients[device.Id] = created;
        return created;
    }

    public async Task RemoveAsync(string deviceId)
    {
        if (_clients.TryRemove(deviceId, out var client))
        {
            await client.DisposeAsync();
        }
    }

    public async ValueTask DisposeAsync()
    {
        foreach (var key in _clients.Keys.ToArray())
        {
            await RemoveAsync(key);
        }
    }
}
