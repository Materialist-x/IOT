using System.Collections.Concurrent;
using System.Threading.Tasks;
using Project2.Models;

namespace Project2.Realtime
{
    public sealed class RedisService
    {
        private readonly ConcurrentDictionary<string, string> _values =
            new ConcurrentDictionary<string, string>();

        public Task SetAsync(TagValue tag)
        {
            _values[BuildKey(tag.TenantId, tag.DeviceId, tag.TagName)] =
                tag.Value == null ? string.Empty : tag.Value.ToString();
            return Task.FromResult(0);
        }

        public bool TryGet(string tenantId, string deviceId, string tagName, out string value)
        {
            return _values.TryGetValue(BuildKey(tenantId, deviceId, tagName), out value);
        }

        private static string BuildKey(string tenantId, string deviceId, string tagName)
        {
            return "rt:" + tenantId + ":" + deviceId + ":" + tagName;
        }
    }
}
