using System;

namespace Project2.Models
{
    public sealed class LicenseSubscription
    {
        public string TenantId { get; set; }

        public string DeviceId { get; set; }

        public LicenseType LicenseType { get; set; }

        public DateTime ExpireTime { get; set; }

        public bool IsSystemGenerated { get; set; }
    }
}
