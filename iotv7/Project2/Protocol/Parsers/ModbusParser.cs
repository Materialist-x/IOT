using System.Collections.Generic;
using System.Globalization;
using Project2.Models;

namespace Project2.Protocol.Parsers
{
    public sealed class ModbusParser : IProtocolParser
    {
        public bool CanParse(byte[] payload)
        {
            return payload.Length >= 8 && payload[2] == 0 && payload[3] == 0;
        }

        public IReadOnlyList<TagValue> Parse(IncomingTcpMessage message)
        {
            var values = new List<TagValue>();
            if (message.Payload.Length < 10)
            {
                return values;
            }

            var byteCount = message.Payload[8];
            var offset = 9;
            var registerIndex = 0;
            while (offset + 1 < message.Payload.Length && registerIndex * 2 < byteCount)
            {
                values.Add(new TagValue
                {
                    TenantId = message.TenantId,
                    DeviceId = message.DeviceId,
                    TagName = "R" + registerIndex.ToString(CultureInfo.InvariantCulture),
                    Value = (message.Payload[offset] << 8) | message.Payload[offset + 1],
                    Timestamp = message.ReceivedAt,
                    Quality = Quality.Good,
                    Source = "ModbusTCP"
                });
                offset += 2;
                registerIndex++;
            }

            return values;
        }
    }
}
