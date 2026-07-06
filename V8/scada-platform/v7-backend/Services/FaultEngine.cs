using System.Collections.Concurrent;

namespace V7Backend.Services;

public class FaultEngine
{
    private readonly ConcurrentDictionary<string, int> _errorCount = new(StringComparer.OrdinalIgnoreCase);
    private readonly DeviceService _devices;
    private readonly List<FaultRecordDto> _records = [];
    private readonly object _lock = new();

    public FaultEngine(DeviceService devices)
    {
        _devices = devices;
    }

    public FaultRecordDto Report(DeviceDto device, string reason, byte[] frame)
    {
        var count = _errorCount.AddOrUpdate(device.Id, 1, (_, current) => current + 1);
        var record = new FaultRecordDto(
            Guid.NewGuid().ToString("N"),
            DateTimeOffset.UtcNow,
            device.Id,
            device.Protocol,
            reason,
            BitConverter.ToString(frame).Replace("-", " "));

        lock (_lock)
        {
            _records.Insert(0, record);
            if (_records.Count > 500)
            {
                _records.RemoveRange(500, _records.Count - 500);
            }
        }

        Console.WriteLine($"[FAULT] {device.Id} | {reason} | {record.FrameHex}");

        if (count >= 5)
        {
            _devices.Touch(device.Id, "OFFLINE");
        }

        return record;
    }

    public void Reset(string deviceId)
    {
        _errorCount.TryRemove(deviceId, out _);
    }

    public IReadOnlyList<FaultRecordDto> GetAll()
    {
        lock (_lock)
        {
            return _records.ToArray();
        }
    }

    public string GetLastReason(string deviceId)
    {
        lock (_lock)
        {
            return _records.FirstOrDefault(record => record.DeviceId.Equals(deviceId, StringComparison.OrdinalIgnoreCase))?.Reason ?? "";
        }
    }
}

public record FaultRecordDto(
    string Id,
    DateTimeOffset Time,
    string DeviceId,
    string Protocol,
    string Reason,
    string FrameHex);
