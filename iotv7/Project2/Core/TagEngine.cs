using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Project2.History;
using Project2.Models;
using Project2.Realtime;

namespace Project2.Core
{
    public sealed class TagEngine
    {
        private readonly MemoryCache _memoryCache;
        private readonly RedisService _redisService;
        private readonly InfluxService _influxService;
        private readonly WebSocketHub _webSocketHub;

        public TagEngine(
            MemoryCache memoryCache,
            RedisService redisService,
            InfluxService influxService,
            WebSocketHub webSocketHub)
        {
            _memoryCache = memoryCache;
            _redisService = redisService;
            _influxService = influxService;
            _webSocketHub = webSocketHub;
        }

        public async Task ProcessAsync(IReadOnlyList<TagValue> values, CancellationToken cancellationToken)
        {
            foreach (var value in values)
            {
                var changed = _memoryCache.Upsert(value);
                await _redisService.SetAsync(value).ConfigureAwait(false);
                await _influxService.WriteAsync(value).ConfigureAwait(false);
                if (changed)
                {
                    await _webSocketHub.BroadcastAsync(value).ConfigureAwait(false);
                }
            }
        }
    }
}
