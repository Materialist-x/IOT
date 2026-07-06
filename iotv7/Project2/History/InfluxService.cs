using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Threading.Tasks;
using Project2.Models;

namespace Project2.History
{
    public sealed class InfluxService
    {
        private readonly ConcurrentDictionary<string, ConcurrentBag<TagValue>> _points =
            new ConcurrentDictionary<string, ConcurrentBag<TagValue>>();

        public Task WriteAsync(TagValue tag)
        {
            var tenantPoints = _points.GetOrAdd(tag.TenantId, key => new ConcurrentBag<TagValue>());
            tenantPoints.Add(tag);
            return Task.FromResult(0);
        }

        public IReadOnlyList<TagValue> Query(string tenantId, string deviceId, DateTime fromUtc)
        {
            ConcurrentBag<TagValue> tenantPoints;
            if (!_points.TryGetValue(tenantId, out tenantPoints))
            {
                return new List<TagValue>();
            }

            var result = new List<TagValue>();
            foreach (var point in tenantPoints)
            {
                if (point.DeviceId == deviceId && point.Timestamp >= fromUtc)
                {
                    result.Add(point);
                }
            }

            return result;
        }

        public int Count
        {
            get
            {
                var count = 0;
                foreach (var pair in _points)
                {
                    count += pair.Value.Count;
                }

                return count;
            }
        }

        public int CountTenant(string tenantId)
        {
            ConcurrentBag<TagValue> tenantPoints;
            return _points.TryGetValue(tenantId, out tenantPoints) ? tenantPoints.Count : 0;
        }
    }
}
