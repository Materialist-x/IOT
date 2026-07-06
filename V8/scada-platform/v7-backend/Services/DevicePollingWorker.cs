using V7Backend.Models;

namespace V7Backend.Services;

public class DevicePollingWorker
{
    private readonly IoManager _ioManager;

    public DevicePollingWorker(IoManager ioManager)
    {
        _ioManager = ioManager;
    }

    public Task ExecuteAsync(DeviceDto device, PollingConfigModel plan, CancellationToken cancellationToken)
    {
        var tags = plan.Tags
            .Where(tag => tag.Enable)
            .Select(tag => new TagDto(tag.TagId, device.Id, tag.Name, tag.Address, tag.Multiplier, null, "UNCERTAIN", DateTimeOffset.MinValue))
            .ToArray();

        return tags.Length == 0
            ? Task.CompletedTask
            : _ioManager.ExecuteAsync(device, tags, cancellationToken);
    }
}
