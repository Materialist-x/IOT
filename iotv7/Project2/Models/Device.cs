using System;

namespace Project2.Models
{
    public sealed class Device
    {
        public string DeviceId { get; set; }

        public string TenantId { get; set; }

        public string DeviceName { get; set; }

        public ProtocolType ProtocolType { get; set; }

        public DeviceStatus Status { get; set; }

        public DateTime LastSeenTime { get; set; }
    }
}
