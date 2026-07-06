using System.Text;
using System.Text.Json;

namespace V7Backend.Services;

public class JsonProtocolHandler : IProtocolHandler
{
    public string ProtocolKey => "json";

    public byte[] BuildRequest(TagDto tag, DeviceDto device)
    {
        var payload = JsonSerializer.Serialize(new
        {
            deviceId = device.Id,
            tagId = tag.Id,
            tag = tag.Name,
            address = tag.Address
        });
        return Encoding.UTF8.GetBytes(payload + "\n");
    }

    public IReadOnlyList<TagValueDto> ParseResponse(byte[] response, DeviceDto device, TagDto tag)
    {
        var json = Encoding.UTF8.GetString(response).Trim();
        using var document = JsonDocument.Parse(json);
        var root = document.RootElement;

        if (root.TryGetProperty("value", out var directValue))
        {
            return
            [
                new TagValueDto(tag.Id, Math.Round(directValue.GetDouble() * tag.Scale, 4), "GOOD")
            ];
        }

        if (root.TryGetProperty(tag.Address, out var fieldValue))
        {
            return
            [
                new TagValueDto(tag.Id, Math.Round(fieldValue.GetDouble() * tag.Scale, 4), "GOOD")
            ];
        }

        if (root.TryGetProperty(tag.Name, out var namedValue))
        {
            return
            [
                new TagValueDto(tag.Id, Math.Round(namedValue.GetDouble() * tag.Scale, 4), "GOOD")
            ];
        }

        throw new InvalidOperationException($"JSON payload does not contain value for tag {tag.Name}.");
    }
}
