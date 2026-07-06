using System;
using System.Collections.Generic;
using Project2.History;
using Project2.Models;

namespace Project2.Api
{
    public sealed class HistoryController
    {
        private readonly InfluxService _influxService;

        public HistoryController(InfluxService influxService)
        {
            _influxService = influxService;
        }

        public IReadOnlyList<TagValue> Query(string tenantId, string deviceId, DateTime fromUtc)
        {
            return _influxService.Query(tenantId, deviceId, fromUtc);
        }
    }
}
