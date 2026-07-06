namespace V7Backend.Services;

public class Dlt645ProtocolHandler : IProtocolHandler
{
    public string ProtocolKey => "dlt645";

    public byte[] BuildRequest(TagDto tag, DeviceDto device)
    {
        var data = new byte[]
        {
            0x68,
            0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA,
            0x68,
            0x11,
            0x04,
            0x33, 0x33, 0x33, 0x33
        };

        var checksum = ComputeChecksum(data);
        return [.. data, checksum, 0x16];
    }

    public IReadOnlyList<TagValueDto> ParseResponse(byte[] response, DeviceDto device, TagDto tag)
    {
        var payload = response.Skip(10).Take(Math.Max(response.Length - 12, 0)).ToArray();
        Array.Reverse(payload);
        var digits = payload.Select(value => (byte)(value - 0x33)).ToArray();
        var text = BitConverter.ToString(digits).Replace("-", string.Empty);
        var parsed = double.TryParse(text, out var value) ? value : 0d;

        return
        [
            new TagValueDto(tag.Id, Math.Round(parsed * tag.Scale, 4), "GOOD")
        ];
    }

    private static byte ComputeChecksum(byte[] frame)
    {
        byte sum = 0;
        foreach (var value in frame)
        {
            unchecked
            {
                sum += value;
            }
        }

        return sum;
    }
}
