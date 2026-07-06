using System;

namespace Project2.Models
{
    public sealed class ScadaCommand
    {
        public string CommandId { get; set; }

        public string TenantId { get; set; }

        public string DeviceId { get; set; }

        public string Payload { get; set; }

        public CommandStatus Status { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }
    }
}
