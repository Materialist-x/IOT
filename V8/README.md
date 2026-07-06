# V8 Industrial IoT Cloud Platform

Minimal runnable distributed Industrial IoT V8 system.

## Run

```bash
docker compose up --build
```

Services:

- Frontend: http://localhost:3000
- TCP Gateway: `localhost:9000`
- Gateway metadata API: http://localhost:8080
- SignalR hub: http://localhost:8090/tenant/T1/tags
- RabbitMQ management: http://localhost:15672 (`v8` / `v8_password`)
- Redis: `localhost:6379`
- PostgreSQL: `localhost:5432`
- InfluxDB: http://localhost:8086

## Data Flow

```text
Device -> TCP Gateway -> RabbitMQ -> Ingestion Service -> Stream Engine -> Redis + InfluxDB -> SignalR -> Frontend
```

The TCP gateway only accepts raw bytes and forwards them to RabbitMQ. It does not parse, store, or apply business rules.

## Test Telemetry

After `docker-compose up --build`, open http://localhost:3000, log in with tenant `T1`, then send telemetry:

```powershell
$client = [System.Net.Sockets.TcpClient]::new("127.0.0.1",9000)
$stream = $client.GetStream()
$json = '{"deviceId":"DEV001","tenantId":"T1","tags":{"temp":85,"pressure":10}}'
$bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
$stream.Write($bytes,0,$bytes.Length)
$client.Close()
```

Expected result:

- RabbitMQ receives raw telemetry.
- Ingestion converts JSON tags into `TagValue` messages.
- Stream engine stores latest values in Redis.
- Stream engine writes history to InfluxDB.
- `temp > 80` generates an alarm.
- SignalR pushes tag and alarm events to the frontend.

## TagValue

```json
{
  "TenantId": "T1",
  "DeviceId": "DEV001",
  "TagName": "temp",
  "Value": 85,
  "Timestamp": "2026-06-27T00:00:00.000Z",
  "Quality": 1,
  "Source": "json"
}
```

Internally the Node services use camelCase fields while preserving the same model semantics.

## Cloud / Edge Configuration

The V8 frontend exposes cloud-managed edge configuration screens:

- Device configuration includes activation code, protocol, host, port, enable state, and location.
- Tag polling configuration includes address, register type, data type, interval, retry, timeout, enable state, multiplier, and offset.
- Runtime tag values keep the raw value and apply `displayValue = rawValue * multiplier + offset` in the frontend store before display.
