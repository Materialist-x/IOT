using System.Net.Http.Json;

namespace V7Backend.Services;

public class CloudBridgeService
{
    private readonly HttpClient _httpClient;
    private readonly EdgeBufferService _buffer;
    private readonly ILogger<CloudBridgeService> _logger;
    private readonly string _baseUrl;

    public CloudBridgeService(HttpClient httpClient, EdgeBufferService buffer, IConfiguration configuration, ILogger<CloudBridgeService> logger)
    {
        _httpClient = httpClient;
        _buffer = buffer;
        _logger = logger;
        _baseUrl = configuration["CloudBridge:BaseUrl"] ?? "http://localhost:8080";
    }

    public Task UploadTagAsync(TagPacket packet, CancellationToken cancellationToken)
    {
        return PushAsync("tag", "/api/edge/tag", packet, cancellationToken);
    }

    public Task UploadAlarmAsync(AlarmPacket packet, CancellationToken cancellationToken)
    {
        return PushAsync("alarm", "/api/edge/alarm", packet, cancellationToken);
    }

    public Task UploadDeviceStatusAsync(DevicePacket packet, CancellationToken cancellationToken)
    {
        return PushAsync("device", "/api/edge/device", packet, cancellationToken);
    }

    private async Task PushAsync(string kind, string path, object packet, CancellationToken cancellationToken)
    {
        try
        {
            var response = await _httpClient.PostAsJsonAsync($"{_baseUrl}{path}", packet, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                _buffer.Enqueue(kind, packet);
                _logger.LogWarning("Cloud bridge buffered {Kind} packet after status {StatusCode}", kind, response.StatusCode);
            }
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            _buffer.Enqueue(kind, packet);
            _logger.LogWarning(ex, "Cloud bridge buffered {Kind} packet after transport failure", kind);
        }
    }
}

public record TagPacket(string DeviceId, string TagId, string TagName, double Value, string Quality, DateTimeOffset Ts);
public record AlarmPacket(string DeviceId, string TagId, string Level, string Message, DateTimeOffset Ts);
public record DevicePacket(string DeviceId, string Status, double Health, DateTimeOffset LastSeen);
