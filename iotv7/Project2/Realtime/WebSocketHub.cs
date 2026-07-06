using System;
using System.Threading.Tasks;
using Project2.Models;

namespace Project2.Realtime
{
    public sealed class WebSocketHub
    {
        public event Action<TagValue> Broadcasted;

        public Task BroadcastAsync(TagValue tag)
        {
            var handler = Broadcasted;
            if (handler != null)
            {
                handler(tag);
            }

            return Task.FromResult(0);
        }

        public static string DeviceChannel(string tenantId, string deviceId)
        {
            return "tenant/" + tenantId + "/device/" + deviceId;
        }

        public static string TagsChannel(string tenantId)
        {
            return "tenant/" + tenantId + "/tags";
        }
    }
}
