using V7Backend.WebSocket;

namespace V7Backend.Services;

public class TagEngineService
{
    private readonly TagService _tags;
    private readonly AlarmService _alarms;
    private readonly HistorianService _historian;
    private readonly WsHub _hub;
    private readonly CloudBridgeService _cloudBridge;
    private readonly Dictionary<string, double> _lastPublished = new(StringComparer.OrdinalIgnoreCase);

    public TagEngineService(TagService tags, AlarmService alarms, HistorianService historian, WsHub hub, CloudBridgeService cloudBridge)
    {
        _tags = tags;
        _alarms = alarms;
        _historian = historian;
        _hub = hub;
        _cloudBridge = cloudBridge;
    }

    public async Task<TagDto> ProcessAsync(string tagId, double value, string quality, CancellationToken cancellationToken)
    {
        var updated = _tags.UpdateValue(tagId, value, quality);
        _historian.BatchAppend([new HistoryPointDto(updated.Id, updated.DeviceId, updated.Name, value, DateTimeOffset.UtcNow)]);

        if (ShouldPublish(updated.Id, value))
        {
            await _hub.BroadcastAsync(new
            {
                type = "tag.update",
                payload = updated
            }, cancellationToken);
        }

        await _cloudBridge.UploadTagAsync(
            new TagPacket(updated.DeviceId, updated.Id, updated.Name, value, quality, DateTimeOffset.UtcNow),
            cancellationToken);

        var alarm = _alarms.Evaluate(updated, value);
        if (alarm is not null)
        {
            await _hub.BroadcastAsync(new
            {
                type = "alarm.event",
                payload = alarm
            }, cancellationToken);
            await _cloudBridge.UploadAlarmAsync(
                new AlarmPacket(alarm.DeviceId, alarm.TagId, alarm.Level, $"{alarm.TagName} {alarm.Condition} {alarm.Threshold}", alarm.Time),
                cancellationToken);
        }

        return updated;
    }

    public Task BroadcastLicenseAsync(LicenseInfo license, CancellationToken cancellationToken)
    {
        return _hub.BroadcastAsync(new
        {
            type = "license.update",
            payload = license
        }, cancellationToken);
    }

    public async Task<IReadOnlyList<TagDto>> UpdateFromPollingAsync(IReadOnlyList<TagValueDto> values, CancellationToken cancellationToken)
    {
        var updated = new List<TagDto>();
        foreach (var value in values)
        {
            updated.Add(await ProcessAsync(value.TagId, value.Value, value.Quality, cancellationToken));
        }

        return updated;
    }

    private bool ShouldPublish(string tagId, double value)
    {
        if (!_lastPublished.TryGetValue(tagId, out var previous))
        {
            _lastPublished[tagId] = value;
            return true;
        }

        if (Math.Abs(previous - value) < 0.0001d)
        {
            return false;
        }

        _lastPublished[tagId] = value;
        return true;
    }
}
