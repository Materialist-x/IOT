using System.Text;
using System.Text.Json;

namespace V7Backend.Services;

public class FrameValidator : IFrameValidator
{
    public bool Validate(byte[] frame, DeviceDto device, out string reason)
    {
        reason = string.Empty;
        var protocol = NormalizeProtocol(device.Protocol);

        if (frame.Length == 0)
        {
            reason = "Empty response frame.";
            return false;
        }

        if (protocol == "modbustcp")
        {
            if (frame.Length < 9)
            {
                reason = "Modbus TCP frame too short.";
                return false;
            }

            if (frame[7] != 0x03 && frame[7] != 0x04)
            {
                reason = $"Unexpected Modbus function code: 0x{frame[7]:X2}.";
                return false;
            }

            return true;
        }

        if (protocol == "dlt645")
        {
            if (frame.Length < 12)
            {
                reason = "DL/T645 frame too short.";
                return false;
            }

            if (frame[0] != 0x68 || frame[7] != 0x68 || frame[^1] != 0x16)
            {
                reason = "DL/T645 header or trailer is invalid.";
                return false;
            }

            byte checksum = 0;
            for (var index = 0; index < frame.Length - 2; index++)
            {
                unchecked
                {
                    checksum += frame[index];
                }
            }

            if (checksum != frame[^2])
            {
                reason = "DL/T645 checksum mismatch.";
                return false;
            }

            return true;
        }

        if (protocol == "json")
        {
            try
            {
                var payload = Encoding.UTF8.GetString(frame).Trim();
                using var document = JsonDocument.Parse(payload);
                var root = document.RootElement;
                if (!root.TryGetProperty("value", out _) && root.EnumerateObject().Count() == 0)
                {
                    reason = "JSON payload contains no value.";
                    return false;
                }

                return true;
            }
            catch (Exception ex)
            {
                reason = $"Invalid JSON payload: {ex.Message}";
                return false;
            }
        }

        reason = $"Unsupported protocol: {device.Protocol}.";
        return false;
    }

    private static string NormalizeProtocol(string protocol)
    {
        return protocol.Replace(" ", string.Empty, StringComparison.OrdinalIgnoreCase).ToLowerInvariant();
    }
}
