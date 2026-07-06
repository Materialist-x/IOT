using System.Collections.Generic;
using System.Text;
using Project2.Models;

namespace Project2.Protocol.Parsers
{
    public sealed class DLT645Parser : IProtocolParser
    {
        public bool CanParse(byte[] payload)
        {
            return true;
        }

        public IReadOnlyList<TagValue> Parse(IncomingTcpMessage message)
        {
            return new List<TagValue>
            {
                new TagValue
                {
                    TenantId = message.TenantId,
                    DeviceId = message.DeviceId,
                    TagName = "Dlt645Raw",
                    Value = Encoding.ASCII.GetString(message.Payload),
                    Timestamp = message.ReceivedAt,
                    Quality = Quality.Good,
                    Source = "DLT645"
                }
            };
        }
    }
}
