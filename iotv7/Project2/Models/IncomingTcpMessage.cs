using System;

namespace Project2.Models
{
    public sealed class IncomingTcpMessage
    {
        public IncomingTcpMessage(string tenantId, string deviceId, string sessionId, byte[] payload, MessageKind kind, DateTime receivedAt)
        {
            TenantId = tenantId;
            DeviceId = deviceId;
            SessionId = sessionId;
            Payload = payload;
            Kind = kind;
            ReceivedAt = receivedAt;
        }

        public string TenantId { get; private set; }

        public string DeviceId { get; private set; }

        public string SessionId { get; private set; }

        public byte[] Payload { get; private set; }

        public MessageKind Kind { get; private set; }

        public DateTime ReceivedAt { get; private set; }
    }
}
