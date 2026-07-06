using System;

namespace Project2.Models
{
    public sealed class Tenant
    {
        public string TenantId { get; set; }

        public string TenantName { get; set; }

        public TenantStatus Status { get; set; }

        public DateTime ExpireTime { get; set; }

        public PlanType PlanType { get; set; }
    }
}
