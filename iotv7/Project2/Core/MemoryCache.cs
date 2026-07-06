using System.Collections.Concurrent;
using System.Collections.Generic;
using Project2.Models;

namespace Project2.Core
{
    public sealed class MemoryCache
    {
        private readonly ConcurrentDictionary<string, ConcurrentDictionary<string, ConcurrentDictionary<string, TagValue>>> _values =
            new ConcurrentDictionary<string, ConcurrentDictionary<string, ConcurrentDictionary<string, TagValue>>>();

        public bool Upsert(TagValue value)
        {
            var tenantValues = _values.GetOrAdd(value.TenantId, key => new ConcurrentDictionary<string, ConcurrentDictionary<string, TagValue>>());
            var deviceValues = tenantValues.GetOrAdd(value.DeviceId, key => new ConcurrentDictionary<string, TagValue>());

            var changed = true;
            deviceValues.AddOrUpdate(
                value.TagName,
                value,
                (key, existing) =>
                {
                    changed = !object.Equals(existing.Value, value.Value) ||
                              existing.Quality != value.Quality ||
                              existing.Source != value.Source;
                    return value;
                });

            return changed;
        }

        public IReadOnlyDictionary<string, TagValue> Snapshot(string tenantId, string deviceId)
        {
            ConcurrentDictionary<string, ConcurrentDictionary<string, TagValue>> tenantValues;
            ConcurrentDictionary<string, TagValue> deviceValues;
            if (!_values.TryGetValue(tenantId, out tenantValues) ||
                !tenantValues.TryGetValue(deviceId, out deviceValues))
            {
                return new Dictionary<string, TagValue>();
            }

            return new Dictionary<string, TagValue>(deviceValues);
        }
    }
}
