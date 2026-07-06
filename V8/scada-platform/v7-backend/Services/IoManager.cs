using V7Backend.WebSocket;

namespace V7Backend.Services;

public class IoManager
{
    private readonly DeviceClientPool _pool;
    private readonly ProtocolHandlerRegistry _protocols;
    private readonly ReliableIoPipeline _pipeline;
    private readonly DeviceHealthMonitor _healthMonitor;
    private readonly DeviceService _devices;
    private readonly FaultEngine _faults;
    private readonly WsHub _hub;

    public IoManager(
        DeviceClientPool pool,
        ProtocolHandlerRegistry protocols,
        ReliableIoPipeline pipeline,
        DeviceHealthMonitor healthMonitor,
        DeviceService devices,
        FaultEngine faults,
        WsHub hub)
    {
        _pool = pool;
        _protocols = protocols;
        _pipeline = pipeline;
        _healthMonitor = healthMonitor;
        _devices = devices;
        _faults = faults;
        _hub = hub;
    }

    public async Task ExecuteAsync(DeviceDto device, IReadOnlyList<TagDto> tags, CancellationToken cancellationToken)
    {
        try
        {
            var protocol = _protocols.Get(device.Protocol);
            var client = await _pool.GetOrCreateAsync(device, cancellationToken);
            _devices.Touch(device.Id, "ONLINE");
            await BroadcastDeviceStatusAsync(device.Id, cancellationToken);
            await BroadcastStatusAsync("polling", device.Id, $"{device.Protocol} polling started", cancellationToken, new
            {
                device.Host,
                device.Port,
                health = _healthMonitor.GetHealth(device.Id)
            });

            foreach (var tag in tags)
            {
                var request = protocol.BuildRequest(tag, device);
                await BroadcastStatusAsync("query-sent", device.Id, $"Query sent for {tag.Name}", cancellationToken, new
                {
                    command = ToHex(request),
                    address = tag.Address
                });

                var response = await client.SendAsync(request, cancellationToken);
                await BroadcastStatusAsync("response-received", device.Id, $"Response received for {tag.Name}", cancellationToken, new
                {
                    response = ToHex(response)
                });

                var result = await _pipeline.ProcessAsync(device, response, protocol, tag, cancellationToken);
                if (!result.Accepted)
                {
                    if (result.Fault is not null)
                    {
                        await _hub.BroadcastAsync(new
                        {
                            type = "fault.event",
                            payload = result.Fault
                        }, cancellationToken);
                    }
                    await BroadcastDeviceStatusAsync(device.Id, cancellationToken);
                    await BroadcastStatusAsync("frame-dropped", device.Id, $"Frame dropped for {tag.Name}", cancellationToken, new
                    {
                        health = _healthMonitor.GetHealth(device.Id),
                        lastError = _faults.GetLastReason(device.Id)
                    });
                    continue;
                }

                await BroadcastDeviceStatusAsync(device.Id, cancellationToken);
                await BroadcastStatusAsync("pipeline-ok", device.Id, $"TagEngine updated for {tag.Name}", cancellationToken, new
                {
                    health = _healthMonitor.GetHealth(device.Id)
                });
            }
        }
        catch (Exception ex)
        {
            _devices.Touch(device.Id, "OFFLINE");
            _healthMonitor.RecordFailure(device.Id);
            await _pool.RemoveAsync(device.Id);
            await BroadcastDeviceStatusAsync(device.Id, cancellationToken);
            await BroadcastStatusAsync("io-error", device.Id, ex.Message, cancellationToken, new
            {
                health = _healthMonitor.GetHealth(device.Id),
                lastError = _faults.GetLastReason(device.Id)
            });
        }
    }

    private Task BroadcastDeviceStatusAsync(string deviceId, CancellationToken cancellationToken)
    {
        var device = _devices.Get(deviceId);
        if (device is null)
        {
            return Task.CompletedTask;
        }

        return _hub.BroadcastAsync(new
        {
            type = "device.status",
            payload = new
            {
                id = device.Id,
                status = device.Status,
                health = _healthMonitor.GetHealth(device.Id),
                lastError = _faults.GetLastReason(device.Id),
                lastSeen = device.LastSeen
            }
        }, cancellationToken);
    }

    private Task BroadcastStatusAsync(string stage, string deviceId, string detail, CancellationToken cancellationToken, object? extra = null)
    {
        return _hub.BroadcastAsync(new
        {
            type = "runtime.tcp.status",
            payload = new
            {
                stage,
                deviceId,
                detail,
                time = DateTimeOffset.UtcNow,
                extra
            }
        }, cancellationToken);
    }

    private static string ToHex(byte[] buffer)
    {
        return BitConverter.ToString(buffer).Replace("-", " ");
    }
}
