using V7Backend.WebSocket;

namespace V7Backend.Services;

public class TagEngineService
{
    private readonly TagService _tags;
    private readonly AlarmService _alarms;
    private readonly HistorianService _historian;
    private readonly WsHub _hub;

    public TagEngineService(TagService tags, AlarmService alarms, HistorianService historian, WsHub hub)
    {
        _tags = tags;
        _alarms = alarms;
        _historian = historian;
        _hub = hub;
    }

    public async Task<TagDto> ProcessAsync(string tagId, double value, string quality, CancellationToken cancellationToken)
    {
        var updated = _tags.UpdateValue(tagId, value, quality);
        _historian.Append(updated, value);

        await _hub.BroadcastAsync(new
        {
            type = "tag.update",
            payload = updated
        }, cancellationToken);

        var alarm = _alarms.Evaluate(updated, value);
        if (alarm is not null)
        {
            await _hub.BroadcastAsync(new
            {
                type = "alarm.event",
                payload = alarm
            }, cancellationToken);
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
}
