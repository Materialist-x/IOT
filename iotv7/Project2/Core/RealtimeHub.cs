using System;
using System.Collections.Concurrent;
using Project2.Models;

namespace Project2.Core
{
    public sealed class RealtimeHub
    {
        private readonly ConcurrentDictionary<string, ConcurrentDictionary<string, byte>> _deviceSubscriptions =
            new ConcurrentDictionary<string, ConcurrentDictionary<string, byte>>();

        private readonly ConcurrentDictionary<string, ConcurrentDictionary<string, byte>> _tenantSubscriptions =
            new ConcurrentDictionary<string, ConcurrentDictionary<string, byte>>();

        public event Action<TagValue> Changed;

        public void SubscribeDevice(string clientId, string tenantId, string deviceId)
        {
            var devices = _deviceSubscriptions.GetOrAdd(clientId, key => new ConcurrentDictionary<string, byte>());
            devices[BuildDeviceChannel(tenantId, deviceId)] = 0;
        }

        public void SubscribeTenant(string clientId, string tenantId)
        {
            var tenants = _tenantSubscriptions.GetOrAdd(clientId, key => new ConcurrentDictionary<string, byte>());
            tenants[tenantId] = 0;
        }

        public void UnsubscribeDevice(string clientId, string tenantId, string deviceId)
        {
            ConcurrentDictionary<string, byte> devices;
            if (_deviceSubscriptions.TryGetValue(clientId, out devices))
            {
                byte ignored;
                devices.TryRemove(BuildDeviceChannel(tenantId, deviceId), out ignored);
            }
        }

        public void PublishChanged(TagValue value)
        {
            foreach (var pair in _deviceSubscriptions)
            {
                if (pair.Value.ContainsKey(BuildDeviceChannel(value.TenantId, value.DeviceId)))
                {
                    var handler = Changed;
                    if (handler != null)
                    {
                        handler(value);
                    }
                }
            }

            foreach (var pair in _tenantSubscriptions)
            {
                if (pair.Value.ContainsKey(value.TenantId))
                {
                    var handler = Changed;
                    if (handler != null)
                    {
                        handler(value);
                    }
                }
            }
        }

        public static string TenantDevicesChannel(string tenantId)
        {
            return "tenant/" + tenantId + "/devices";
        }

        public static string TenantAlarmsChannel(string tenantId)
        {
            return "tenant/" + tenantId + "/alarms";
        }

        public static string TenantTagsChannel(string tenantId)
        {
            return "tenant/" + tenantId + "/tags";
        }

        private static string BuildDeviceChannel(string tenantId, string deviceId)
        {
            return tenantId + "/" + deviceId;
        }
    }
}
