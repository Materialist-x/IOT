using System;
using System.Collections.Concurrent;
using System.Threading;
using Project2.Models;

namespace Project2.Core
{
    public sealed class RateLimiter
    {
        private sealed class Window
        {
            public long WindowTicks;

            public int Count;
        }

        private readonly ConcurrentDictionary<string, Window> _tenantWindows =
            new ConcurrentDictionary<string, Window>();

        private readonly ConcurrentDictionary<string, Window> _deviceWindows =
            new ConcurrentDictionary<string, Window>();

        private readonly int _maxTenantMessagesPerSecond;
        private readonly int _maxDeviceMessagesPerSecond;

        public RateLimiter(int maxTenantMessagesPerSecond, int maxDeviceMessagesPerSecond)
        {
            _maxTenantMessagesPerSecond = maxTenantMessagesPerSecond;
            _maxDeviceMessagesPerSecond = maxDeviceMessagesPerSecond;
        }

        public bool Allow(IncomingTcpMessage message)
        {
            if (message.Kind == MessageKind.Alarm)
            {
                return true;
            }

            return Allow(_tenantWindows, message.TenantId, _maxTenantMessagesPerSecond) &&
                   Allow(_deviceWindows, message.TenantId + "/" + message.DeviceId, _maxDeviceMessagesPerSecond);
        }

        private static bool Allow(ConcurrentDictionary<string, Window> windows, string key, int limit)
        {
            var now = DateTime.UtcNow;
            var secondTicks = new DateTime(now.Year, now.Month, now.Day, now.Hour, now.Minute, now.Second, DateTimeKind.Utc).Ticks;
            var window = windows.GetOrAdd(key, ignored => new Window { WindowTicks = secondTicks });

            if (Interlocked.Read(ref window.WindowTicks) != secondTicks)
            {
                Interlocked.Exchange(ref window.WindowTicks, secondTicks);
                Interlocked.Exchange(ref window.Count, 0);
            }

            return Interlocked.Increment(ref window.Count) <= limit;
        }
    }
}
