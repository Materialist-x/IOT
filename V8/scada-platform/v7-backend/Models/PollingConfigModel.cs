using V7Backend.Services;

namespace V7Backend.Models;

public record PollingConfigModel(
    string DeviceId,
    string Protocol,
    int Interval,
    int Retry,
    int Timeout,
    IReadOnlyList<PollingTagModel> Tags)
{
    public static PollingConfigModel FromDevice(DeviceDto device, IReadOnlyList<TagDto> tags)
    {
        return new PollingConfigModel(
            device.Id,
            device.Protocol,
            Math.Max(device.PollIntervalMs, 100),
            3,
            500,
            tags.Select(tag => new PollingTagModel(tag.Id, tag.Name, tag.Address, "holding", tag.Scale, true)).ToArray());
    }
}

public record PollingTagModel(
    string TagId,
    string Name,
    string Address,
    string Type,
    double Multiplier,
    bool Enable);
