using System.Collections.Concurrent;
using V7Backend.WebSocket;

namespace V7Backend.Services;

public class IoScheduler
{
    private readonly DeviceService _devices;
    private readonly TagService _tags;
    private readonly IoManager _ioManager;
    private readonly WsHub _hub;
    private readonly ConcurrentDictionary<string, DateTimeOffset> _lastRun = new(StringComparer.OrdinalIgnoreCase);
    private readonly Random _random = new();

    public IoScheduler(DeviceService devices, TagService tags, IoManager ioManager, WsHub hub)
    {
        _devices = devices;
        _tags = tags;
        _ioManager = ioManager;
        _hub = hub;
    }

    public async Task RunCycleAsync(string? onlyDeviceId, CancellationToken cancellationToken)
    {
        await BroadcastSystemMetricsAsync(cancellationToken);

        var now = DateTimeOffset.UtcNow;
        var devices = _devices.GetAll()
            .Where(device => string.IsNullOrWhiteSpace(onlyDeviceId) || device.Id.Equals(onlyDeviceId, StringComparison.OrdinalIgnoreCase))
            .Where(device => ShouldPoll(device, now))
            .ToArray();

        var tasks = devices.Select(async device =>
        {
            var tags = _tags.GetByDevice(device.Id);
            if (tags.Count == 0)
            {
                return;
            }

            _lastRun[device.Id] = now;
            await _ioManager.ExecuteAsync(device, tags, cancellationToken);
        });

        await Task.WhenAll(tasks);
    }

    private async Task BroadcastSystemMetricsAsync(CancellationToken cancellationToken)
    {
        var points = new[]
        {
            new TagDto("system:cpu", "SYSTEM", "CPU", "cpu", 1d, Math.Round(12 + _random.NextDouble() * 66, 1), "GOOD", DateTimeOffset.UtcNow),
            new TagDto("system:ram", "SYSTEM", "RAM", "ram", 1d, Math.Round(36 + _random.NextDouble() * 40, 1), "GOOD", DateTimeOffset.UtcNow),
            new TagDto("system:net", "SYSTEM", "NET", "net", 1d, Math.Round(8 + _random.NextDouble() * 60, 1), "GOOD", DateTimeOffset.UtcNow)
        };

        foreach (var point in points)
        {
            await _hub.BroadcastAsync(new
            {
                type = "tag.update",
                payload = point
            }, cancellationToken);
        }
    }

    private bool ShouldPoll(DeviceDto device, DateTimeOffset now)
    {
        if (!_lastRun.TryGetValue(device.Id, out var lastRun))
        {
            return true;
        }

        return now - lastRun >= TimeSpan.FromMilliseconds(device.PollIntervalMs);
    }
}
