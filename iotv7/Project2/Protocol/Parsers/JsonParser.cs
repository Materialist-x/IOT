using System;
using System.Collections.Generic;
using System.Text;
using System.Web.Script.Serialization;
using Project2.Models;

namespace Project2.Protocol.Parsers
{
    public sealed class JsonParser : IProtocolParser
    {
        public bool CanParse(byte[] payload)
        {
            var text = Encoding.UTF8.GetString(payload).TrimStart();
            return text.StartsWith("{") || text.StartsWith("[");
        }

        public IReadOnlyList<TagValue> Parse(IncomingTcpMessage message)
        {
            var serializer = new JavaScriptSerializer();
            var values = new List<TagValue>();
            var root = serializer.DeserializeObject(Encoding.UTF8.GetString(message.Payload)) as Dictionary<string, object>;
            if (root == null)
            {
                return values;
            }

            object tagsObject;
            var tags = root.TryGetValue("tags", out tagsObject)
                ? tagsObject as Dictionary<string, object>
                : root;

            if (tags == null)
            {
                return values;
            }

            foreach (var pair in tags)
            {
                if (IsReserved(pair.Key))
                {
                    continue;
                }

                values.Add(new TagValue
                {
                    TenantId = message.TenantId,
                    DeviceId = message.DeviceId,
                    TagName = pair.Key,
                    Value = pair.Value,
                    Timestamp = message.ReceivedAt,
                    Quality = Quality.Good,
                    Source = "JSON"
                });
            }

            return values;
        }

        private static bool IsReserved(string field)
        {
            return string.Equals(field, "tenantId", StringComparison.OrdinalIgnoreCase) ||
                   string.Equals(field, "deviceId", StringComparison.OrdinalIgnoreCase) ||
                   string.Equals(field, "timestamp", StringComparison.OrdinalIgnoreCase);
        }
    }
}
