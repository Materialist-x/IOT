using Microsoft.AspNetCore.Mvc;
using V7Backend.Services;

namespace V7Backend.Controllers;

[ApiController]
[Route("api/device")]
public class DeviceController : ControllerBase
{
    private readonly DeviceService _devices;
    private readonly LicenseService _licenses;
    private readonly TagService _tags;
    private readonly TagEngineService _tagEngine;
    private readonly DeviceHealthMonitor _health;
    private readonly FaultEngine _faults;
    private readonly PollingScheduler _scheduler;

    public DeviceController(DeviceService devices, LicenseService licenses, TagService tags, TagEngineService tagEngine, DeviceHealthMonitor health, FaultEngine faults, PollingScheduler scheduler)
    {
        _devices = devices;
        _licenses = licenses;
        _tags = tags;
        _tagEngine = tagEngine;
        _health = health;
        _faults = faults;
        _scheduler = scheduler;
    }

    [HttpGet]
    public IActionResult Get()
    {
        return Ok(_devices.GetAll().Select(device => new DeviceStatusDto(
            device.Id,
            device.Name,
            device.DeviceNo,
            device.Status,
            device.Protocol,
            device.LicenseCode,
            device.Host,
            device.Port,
            device.PollIntervalMs,
            _health.GetHealth(device.Id),
            _faults.GetLastReason(device.Id),
            device.LastSeen,
            device.JsonMappings,
            device.ModbusStation,
            device.RegisterAddress,
            device.TagDefinitions)));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDeviceRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var license = _licenses.Activate(request.LicenseCode);
            var device = _devices.Upsert(request);
            _tags.UpsertForDevice(device);
            _scheduler.RegisterDevice(device);
            var updatedLicense = _licenses.UpdateActiveDevices(_devices.GetAll().Count);
            await _tagEngine.BroadcastLicenseAsync(updatedLicense with
            {
                LicenseKey = license.LicenseKey
            }, cancellationToken);
            return Ok(device);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}

public record DeviceStatusDto(
    string Id,
    string Name,
    string DeviceNo,
    string Status,
    string Protocol,
    string LicenseCode,
    string Host,
    int Port,
    int PollIntervalMs,
    double Health,
    string LastError,
    DateTimeOffset LastSeen,
    IReadOnlyDictionary<string, string> JsonMappings,
    string ModbusStation,
    string RegisterAddress,
    IReadOnlyList<TagDefinitionDto> TagDefinitions);
