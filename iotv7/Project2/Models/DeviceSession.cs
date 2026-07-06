using System;
using System.Net.Sockets;

namespace Project2.Models
{
    public sealed class DeviceSession
    {
        public string TenantId { get; set; }

        public string DeviceId { get; set; }

        public string SessionId { get; set; }

        public TcpClient Connection { get; set; }

        public DateTime LastSeenTime { get; set; }

        public DeviceStatus Status { get; set; }
    }
}
