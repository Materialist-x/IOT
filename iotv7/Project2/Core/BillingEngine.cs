using System.Collections.Concurrent;
using System.Threading;
using Project2.Models;

namespace Project2.Core
{
    public sealed class BillingEngine
    {
        private sealed class TenantUsage
        {
            public readonly ConcurrentDictionary<string, byte> Devices = new ConcurrentDictionary<string, byte>();

            public int ActiveConnections;

            public long ThroughputBytes;
        }

        private readonly ConcurrentDictionary<string, TenantUsage> _usage =
            new ConcurrentDictionary<string, TenantUsage>();

        private readonly int _maxDevicesPerTenant;
        private readonly long _maxThroughputBytesPerTenant;

        public BillingEngine(int maxDevicesPerTenant, long maxThroughputBytesPerTenant)
        {
            _maxDevicesPerTenant = maxDevicesPerTenant;
            _maxThroughputBytesPerTenant = maxThroughputBytesPerTenant;
        }

        public bool TryRegisterDevice(string tenantId, string deviceId)
        {
            var usage = _usage.GetOrAdd(tenantId, key => new TenantUsage());
            usage.Devices.TryAdd(deviceId, 0);
            return usage.Devices.Count <= _maxDevicesPerTenant;
        }

        public void ConnectionOpened(string tenantId)
        {
            var usage = _usage.GetOrAdd(tenantId, key => new TenantUsage());
            Interlocked.Increment(ref usage.ActiveConnections);
        }

        public void ConnectionClosed(string tenantId)
        {
            TenantUsage usage;
            if (_usage.TryGetValue(tenantId, out usage))
            {
                Interlocked.Decrement(ref usage.ActiveConnections);
            }
        }

        public bool RecordThroughput(string tenantId, int bytes)
        {
            var usage = _usage.GetOrAdd(tenantId, key => new TenantUsage());
            var total = Interlocked.Add(ref usage.ThroughputBytes, bytes);
            return total <= _maxThroughputBytesPerTenant;
        }

        public int GetDeviceCount(string tenantId)
        {
            TenantUsage usage;
            return _usage.TryGetValue(tenantId, out usage) ? usage.Devices.Count : 0;
        }

        public int GetActiveConnections(string tenantId)
        {
            TenantUsage usage;
            return _usage.TryGetValue(tenantId, out usage) ? usage.ActiveConnections : 0;
        }
    }
}
