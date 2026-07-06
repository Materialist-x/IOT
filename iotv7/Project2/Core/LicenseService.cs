using System;
using System.Collections.Concurrent;
using Project2.Models;

namespace Project2.Core
{
    public sealed class LicenseService
    {
        private sealed class LicenseState
        {
            public bool IsValid;

            public DateTime LastChecked;
        }

        private readonly ConcurrentDictionary<string, LicenseState> _cache =
            new ConcurrentDictionary<string, LicenseState>();

        private readonly TimeSpan _heartbeatInterval;
        private readonly Func<string, bool> _validator;

        public LicenseService(TimeSpan heartbeatInterval, Func<string, bool> validator)
        {
            _heartbeatInterval = heartbeatInterval;
            _validator = validator;
        }

        public bool CheckOnConnect(string tenantId, string deviceId)
        {
            return Refresh(tenantId);
        }

        public bool CheckOnHeartbeat(string tenantId)
        {
            LicenseState state;
            if (_cache.TryGetValue(tenantId, out state) &&
                DateTime.UtcNow - state.LastChecked < _heartbeatInterval)
            {
                return state.IsValid;
            }

            return Refresh(tenantId);
        }

        public bool IsCachedValid(string tenantId)
        {
            LicenseState state;
            return _cache.TryGetValue(tenantId, out state) && state.IsValid;
        }

        public void ExpireTenant(string tenantId)
        {
            _cache.AddOrUpdate(
                tenantId,
                key => new LicenseState { IsValid = false, LastChecked = DateTime.UtcNow },
                (key, state) =>
                {
                    state.IsValid = false;
                    state.LastChecked = DateTime.UtcNow;
                    return state;
                });
        }

        public LicenseSubscription GenerateSubscription(string tenantId, LicenseType licenseType, DateTime expireTime, string deviceId)
        {
            return new LicenseSubscription
            {
                TenantId = tenantId,
                DeviceId = deviceId,
                LicenseType = licenseType,
                ExpireTime = expireTime,
                IsSystemGenerated = true
            };
        }

        private bool Refresh(string tenantId)
        {
            var isValid = _validator(tenantId);
            _cache.AddOrUpdate(
                tenantId,
                key => new LicenseState { IsValid = isValid, LastChecked = DateTime.UtcNow },
                (key, state) =>
                {
                    state.IsValid = isValid;
                    state.LastChecked = DateTime.UtcNow;
                    return state;
                });

            return isValid;
        }
    }
}
