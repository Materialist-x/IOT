using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Net.Sockets;
using Project2.Models;

namespace Project2.Core
{
    public sealed class SessionManager
    {
        private readonly ConcurrentDictionary<string, DeviceSession> _sessions =
            new ConcurrentDictionary<string, DeviceSession>();

        private readonly TimeSpan _idleTimeout;

        public SessionManager(TimeSpan idleTimeout)
        {
            _idleTimeout = idleTimeout;
        }

        public DeviceSession Register(string tenantId, string deviceId, TcpClient connection)
        {
            var session = new DeviceSession
            {
                TenantId = tenantId,
                DeviceId = deviceId,
                SessionId = Guid.NewGuid().ToString("N"),
                Connection = connection,
                LastSeenTime = DateTime.UtcNow,
                Status = DeviceStatus.Online
            };

            _sessions.AddOrUpdate(BuildKey(tenantId, deviceId), session, (key, existing) =>
            {
                existing.Status = DeviceStatus.Offline;
                existing.Connection = null;
                return session;
            });

            return session;
        }

        public bool TryGet(string tenantId, string deviceId, out DeviceSession session)
        {
            return _sessions.TryGetValue(BuildKey(tenantId, deviceId), out session);
        }

        public void Touch(string tenantId, string deviceId)
        {
            DeviceSession session;
            if (_sessions.TryGetValue(BuildKey(tenantId, deviceId), out session))
            {
                session.LastSeenTime = DateTime.UtcNow;
            }
        }

        public void MarkOffline(string tenantId, string deviceId)
        {
            DeviceSession session;
            if (_sessions.TryGetValue(BuildKey(tenantId, deviceId), out session))
            {
                session.Status = DeviceStatus.Offline;
                session.Connection = null;
            }
        }

        public IReadOnlyList<DeviceSession> CleanupIdle()
        {
            var now = DateTime.UtcNow;
            var removed = new List<DeviceSession>();

            foreach (var pair in _sessions)
            {
                if (now - pair.Value.LastSeenTime <= _idleTimeout)
                {
                    continue;
                }

                DeviceSession session;
                if (_sessions.TryRemove(pair.Key, out session))
                {
                    session.Status = DeviceStatus.Offline;
                    session.Connection = null;
                    removed.Add(session);
                }
            }

            return removed;
        }

        public void MarkTenantOffline(string tenantId)
        {
            foreach (var pair in _sessions)
            {
                if (pair.Value.TenantId == tenantId)
                {
                    pair.Value.Status = DeviceStatus.Offline;
                    pair.Value.Connection = null;
                }
            }
        }

        private static string BuildKey(string tenantId, string deviceId)
        {
            return tenantId + "/" + deviceId;
        }
    }
}
