using System.Collections.Concurrent;
using V7Backend.Models;
using V7Backend.WebSocket;

namespace V7Backend.Services;

public class PollingScheduler
{
    private readonly DeviceService _devices;
    private readonly TagService _tags;
    private readonly DevicePollingWorker _worker;
    private readonly WsHub _hub;
    private readonly ConcurrentDictionary<string, PollingRuntimePlan> _plans = new(StringComparer.OrdinalIgnoreCase);
    private readonly Random _random = new();

    public PollingScheduler(DeviceService devices, TagService tags, DevicePollingWorker worker, WsHub hub)
    {
        _devices = devices;
        _tags = tags;
        _worker = worker;
        _hub = hub;
    }

    public void RegisterDevice(DeviceDto device)
    {
        var tags = _tags.GetByDevice(device.Id);
        UpdateConfig(PollingConfigModel.FromDevice(device, tags));
    }

    public void UpdateConfig(PollingConfigModel config)
    {
        _plans[config.DeviceId] = new PollingRuntimePlan(config, DateTimeOffset.MinValue);
    }

    public void Stop(string deviceId)
    {
        _plans.TryRemove(deviceId, out _);
    }

    public async Task RunCycleAsync(string? onlyDeviceId, CancellationToken cancellationToken)
    {
        await BroadcastSystemMetricsAsync(cancellationToken);

        foreach (var device in _devices.GetAll())
        {
            if (!string.IsNullOrWhiteSpace(onlyDeviceId) && !device.Id.Equals(onlyDeviceId, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            var plan = _plans.GetOrAdd(device.Id, _ =>
                new PollingRuntimePlan(PollingConfigModel.FromDevice(device, _tags.GetByDevice(device.Id)), DateTimeOffset.MinValue));

            if (!ShouldPoll(plan, DateTimeOffset.UtcNow))
            {
                continue;
            }

            _plans[device.Id] = plan with { LastRun = DateTimeOffset.UtcNow };
            await _worker.ExecuteAsync(device, plan.Config, cancellationToken);
        }
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
            await _hub.BroadcastAsync(new { type = "tag.update", payload = point }, cancellationToken);
        }
    }

    private static bool ShouldPoll(PollingRuntimePlan plan, DateTimeOffset now)
    {
        return plan.LastRun == DateTimeOffset.MinValue ||
               now - plan.LastRun >= TimeSpan.FromMilliseconds(Math.Max(plan.Config.Interval, 100));
    }
}

public record PollingRuntimePlan(PollingConfigModel Config, DateTimeOffset LastRun);
