using System;

namespace Project2.Core
{
    public sealed class ScadaRuntimeOptions
    {
        public TimeSpan IdleTimeout { get; set; }

        public TimeSpan LicenseHeartbeatInterval { get; set; }

        public TimeSpan BatchFlushInterval { get; set; }

        public int TcpPort { get; set; }

        public int BackpressureThreshold { get; set; }

        public int MaxDevicesPerTenant { get; set; }

        public long MaxThroughputBytesPerTenant { get; set; }

        public int MaxTenantMessagesPerSecond { get; set; }

        public int MaxDeviceMessagesPerSecond { get; set; }

        public static ScadaRuntimeOptions Default()
        {
            return new ScadaRuntimeOptions
            {
                IdleTimeout = TimeSpan.FromSeconds(30),
                LicenseHeartbeatInterval = TimeSpan.FromSeconds(30),
                BatchFlushInterval = TimeSpan.FromSeconds(1),
                TcpPort = 9000,
                BackpressureThreshold = 10000,
                MaxDevicesPerTenant = 10000,
                MaxThroughputBytesPerTenant = 1024L * 1024L * 1024L,
                MaxTenantMessagesPerSecond = 100000,
                MaxDeviceMessagesPerSecond = 1000
            };
        }
    }
}
