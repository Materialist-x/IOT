using System;
using System.Collections.Concurrent;
using System.Text;
using System.Web.Script.Serialization;
using Project2.Models;

namespace Project2.Core
{
    public sealed class TenantResolver
    {
        private readonly ConcurrentDictionary<string, Tenant> _tenants =
            new ConcurrentDictionary<string, Tenant>();

        private readonly ConcurrentDictionary<string, string> _deviceTenants =
            new ConcurrentDictionary<string, string>();

        public void RegisterTenant(Tenant tenant)
        {
            _tenants[tenant.TenantId] = tenant;
        }

        public void RegisterDevice(string tenantId, string deviceId)
        {
            EnsureTenant(tenantId);
            _deviceTenants[BuildDeviceKey(tenantId, deviceId)] = tenantId;
        }

        public bool TryGetTenant(string tenantId, out Tenant tenant)
        {
            return _tenants.TryGetValue(tenantId, out tenant);
        }

        public bool IsTenantActive(string tenantId)
        {
            Tenant tenant;
            return _tenants.TryGetValue(tenantId, out tenant) &&
                   tenant.Status == TenantStatus.Active &&
                   tenant.ExpireTime > DateTime.UtcNow;
        }

        public TenantDeviceIdentity Resolve(TcpIdentity tcpIdentity, byte[] payload)
        {
            var tenantId = tcpIdentity.TenantId;
            var deviceId = tcpIdentity.DeviceId;

            TryResolveFromJson(payload, ref tenantId, ref deviceId);

            if (string.IsNullOrWhiteSpace(tenantId))
            {
                tenantId = "default";
            }

            if (string.IsNullOrWhiteSpace(deviceId))
            {
                deviceId = tcpIdentity.RemoteEndpointKey;
            }

            EnsureTenant(tenantId);
            RegisterDevice(tenantId, deviceId);

            return new TenantDeviceIdentity(tenantId, deviceId);
        }

        public void ExpireTenant(string tenantId)
        {
            Tenant tenant;
            if (_tenants.TryGetValue(tenantId, out tenant))
            {
                tenant.Status = TenantStatus.Expired;
                tenant.ExpireTime = DateTime.UtcNow.AddSeconds(-1);
            }
        }

        private void EnsureTenant(string tenantId)
        {
            _tenants.GetOrAdd(tenantId, key => new Tenant
            {
                TenantId = key,
                TenantName = key,
                Status = TenantStatus.Active,
                ExpireTime = DateTime.UtcNow.AddYears(1),
                PlanType = PlanType.Enterprise
            });
        }

        private static void TryResolveFromJson(byte[] payload, ref string tenantId, ref string deviceId)
        {
            try
            {
                var text = Encoding.UTF8.GetString(payload).TrimStart();
                if (!text.StartsWith("{"))
                {
                    return;
                }

                var serializer = new JavaScriptSerializer();
                var root = serializer.DeserializeObject(text) as System.Collections.Generic.Dictionary<string, object>;
                if (root == null)
                {
                    return;
                }

                object value;
                if (root.TryGetValue("tenantId", out value) && value != null)
                {
                    tenantId = value.ToString();
                }

                if (root.TryGetValue("deviceId", out value) && value != null)
                {
                    deviceId = value.ToString();
                }
            }
            catch
            {
            }
        }

        private static string BuildDeviceKey(string tenantId, string deviceId)
        {
            return tenantId + "/" + deviceId;
        }
    }

    public sealed class TenantDeviceIdentity
    {
        public TenantDeviceIdentity(string tenantId, string deviceId)
        {
            TenantId = tenantId;
            DeviceId = deviceId;
        }

        public string TenantId { get; private set; }

        public string DeviceId { get; private set; }
    }

    public sealed class TcpIdentity
    {
        public TcpIdentity(string tenantId, string deviceId, string remoteEndpointKey)
        {
            TenantId = tenantId;
            DeviceId = deviceId;
            RemoteEndpointKey = remoteEndpointKey;
        }

        public string TenantId { get; private set; }

        public string DeviceId { get; private set; }

        public string RemoteEndpointKey { get; private set; }
    }
}
