using System.Collections.Concurrent;

namespace V7Backend.Services;

public class DeviceHealthMonitor
{
    private readonly ConcurrentDictionary<string, HealthCounter> _counters = new(StringComparer.OrdinalIgnoreCase);

    public void RecordSuccess(string deviceId)
    {
        _counters.AddOrUpdate(deviceId, new HealthCounter(1, 0), (_, current) => current with { Success = current.Success + 1 });
    }

    public void RecordFailure(string deviceId)
    {
        _counters.AddOrUpdate(deviceId, new HealthCounter(0, 1), (_, current) => current with { Failure = current.Failure + 1 });
    }

    public double GetHealth(string deviceId)
    {
        if (!_counters.TryGetValue(deviceId, out var counter))
        {
            return 1d;
        }

        var total = counter.Success + counter.Failure;
        return total == 0 ? 1d : Math.Round(counter.Success / (double)total, 4);
    }

    public int GetFailureCount(string deviceId)
    {
        return _counters.TryGetValue(deviceId, out var counter) ? counter.Failure : 0;
    }

    private record HealthCounter(int Success, int Failure);
}
