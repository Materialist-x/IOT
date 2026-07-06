namespace V7Backend.Services;

public interface IProtocolHandler
{
    string ProtocolKey { get; }
    byte[] BuildRequest(TagDto tag, DeviceDto device);
    IReadOnlyList<TagValueDto> ParseResponse(byte[] response, DeviceDto device, TagDto tag);
}

public record TagValueDto(
    string TagId,
    double Value,
    string Quality);
