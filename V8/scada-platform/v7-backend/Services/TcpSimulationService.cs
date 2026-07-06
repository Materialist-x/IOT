namespace V7Backend.Services;

public class TcpSimulationService
{
    private readonly DeviceService _devices;
    private readonly TagService _tags;
    private readonly LicenseService _licenses;
    private readonly TagEngineService _tagEngine;
    private readonly IoScheduler _scheduler;

    public TcpSimulationService(
        DeviceService devices,
        TagService tags,
        LicenseService licenses,
        TagEngineService tagEngine,
        IoScheduler scheduler)
    {
        _devices = devices;
        _tags = tags;
        _licenses = licenses;
        _tagEngine = tagEngine;
        _scheduler = scheduler;
    }

    public async Task<TcpSimulationResult> RunAsync(RunTcpSimulationRequest request, CancellationToken cancellationToken)
    {
        var license = _licenses.Activate(request.ActivationCode);
        var device = _devices.Upsert(new CreateDeviceRequest(
            request.DeviceId,
            request.DeviceName,
            request.DeviceNo,
            request.Protocol,
            request.ActivationCode,
            ResolveHost(request),
            ResolvePort(request),
            request.ModbusStation,
            request.RegisterAddress,
            request.PollIntervalMs,
            request.JsonMappings,
            request.TagDefinitions));

        var tags = _tags.UpsertForDevice(device);
        var updatedLicense = _licenses.UpdateActiveDevices(_devices.GetAll().Count);
        await _tagEngine.BroadcastLicenseAsync(updatedLicense with
        {
            LicenseKey = license.LicenseKey
        }, cancellationToken);

        await _scheduler.RunCycleAsync(device.Id, cancellationToken);

        var refreshedTags = _tags.GetByDevice(device.Id);
        return new TcpSimulationResult(
            updatedLicense,
            device,
            refreshedTags,
            refreshedTags.FirstOrDefault(tag => tag.Name.Equals("Temp", StringComparison.OrdinalIgnoreCase))?.Address ?? device.RegisterAddress);
    }

    private static string ResolveHost(RunTcpSimulationRequest request)
    {
        return string.IsNullOrWhiteSpace(request.Host) ? "127.0.0.1" : request.Host.Trim();
    }

    private static int ResolvePort(RunTcpSimulationRequest request)
    {
        if (request.Port is > 0)
        {
            return request.Port.Value;
        }

        return request.Protocol.Contains("json", StringComparison.OrdinalIgnoreCase)
            ? LoopbackIoSimulatorService.JsonPort
            : LoopbackIoSimulatorService.ModbusPort;
    }
}

public record RunTcpSimulationRequest(
    string ActivationCode,
    string DeviceId,
    string DeviceName,
    string DeviceNo,
    string Protocol,
    string? Host,
    int? Port,
    string ModbusStation,
    string RegisterAddress,
    int? PollIntervalMs,
    Dictionary<string, string>? JsonMappings,
    List<TagDefinitionDto>? TagDefinitions);

public record TcpSimulationResult(
    LicenseInfo License,
    DeviceDto Device,
    IReadOnlyList<TagDto> Tags,
    string PollingAddress);
