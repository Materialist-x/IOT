using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Project2.Models;

namespace Project2.Core
{
    public sealed class InMemoryBulkTagValueRepository : IBulkTagValueRepository
    {
        private readonly ConcurrentDictionary<string, ConcurrentBag<TagValue>> _storedValues =
            new ConcurrentDictionary<string, ConcurrentBag<TagValue>>();

        public Task BulkInsertAsync(IReadOnlyList<TagValue> values, CancellationToken cancellationToken)
        {
            foreach (var value in values)
            {
                var tenantValues = _storedValues.GetOrAdd(value.TenantId, key => new ConcurrentBag<TagValue>());
                tenantValues.Add(value);
            }

            return Task.FromResult(0);
        }

        public int Count
        {
            get
            {
                var count = 0;
                foreach (var pair in _storedValues)
                {
                    count += pair.Value.Count;
                }

                return count;
            }
        }

        public int CountTenant(string tenantId)
        {
            ConcurrentBag<TagValue> values;
            return _storedValues.TryGetValue(tenantId, out values) ? values.Count : 0;
        }
    }
}
