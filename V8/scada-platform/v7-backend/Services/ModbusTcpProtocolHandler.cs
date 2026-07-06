namespace V7Backend.Services;

public class ModbusTcpProtocolHandler : IProtocolHandler
{
    private int _transactionId;

    public string ProtocolKey => "modbustcp";

    public byte[] BuildRequest(TagDto tag, DeviceDto device)
    {
        var address = ParseAddress(tag.Address);
        var unitId = byte.TryParse(device.ModbusStation, out var parsedUnit) ? parsedUnit : (byte)1;
        var transactionId = unchecked((ushort)Interlocked.Increment(ref _transactionId));

        return
        [
            (byte)(transactionId >> 8),
            (byte)(transactionId & 0xFF),
            0x00,
            0x00,
            0x00,
            0x06,
            unitId,
            0x03,
            (byte)(address >> 8),
            (byte)(address & 0xFF),
            0x00,
            0x01
        ];
    }

    public IReadOnlyList<TagValueDto> ParseResponse(byte[] response, DeviceDto device, TagDto tag)
    {
        var raw = (ushort)((response[9] << 8) | response[10]);
        return
        [
            new TagValueDto(tag.Id, Math.Round(raw * tag.Scale, 4), "GOOD")
        ];
    }

    private static ushort ParseAddress(string raw)
    {
        return ushort.TryParse(raw, out var address) ? address : (ushort)40010;
    }
}
