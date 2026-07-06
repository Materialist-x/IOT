using System;

namespace Project2.Models
{
    public sealed class TagValue
    {
        public string TenantId { get; set; }

        public string DeviceId { get; set; }

        public string TagName { get; set; }

        public object Value { get; set; }

        public DateTime Timestamp { get; set; }

        public Quality Quality { get; set; }

        public string Source { get; set; }
    }
}
