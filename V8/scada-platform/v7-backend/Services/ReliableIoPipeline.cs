namespace V7Backend.Services;

public class ReliableIoPipeline
{
    private readonly IFrameValidator _validator;
    private readonly FaultEngine _faultEngine;
    private readonly DeviceHealthMonitor _healthMonitor;
    private readonly TagEngineService _tagEngine;

    public ReliableIoPipeline(
        IFrameValidator validator,
        FaultEngine faultEngine,
        DeviceHealthMonitor healthMonitor,
        TagEngineService tagEngine)
    {
        _validator = validator;
        _faultEngine = faultEngine;
        _healthMonitor = healthMonitor;
        _tagEngine = tagEngine;
    }

    public async Task<ReliableIoResult> ProcessAsync(
        DeviceDto device,
        byte[] frame,
        IProtocolHandler protocol,
        TagDto tag,
        CancellationToken cancellationToken)
    {
        if (!_validator.Validate(frame, device, out var reason))
        {
            var fault = _faultEngine.Report(device, reason, frame);
            _healthMonitor.RecordFailure(device.Id);
            return new ReliableIoResult(false, fault);
        }

        var values = protocol.ParseResponse(frame, device, tag);
        foreach (var value in values)
        {
            await _tagEngine.ProcessAsync(value.TagId, value.Value, value.Quality, cancellationToken);
        }

        _faultEngine.Reset(device.Id);
        _healthMonitor.RecordSuccess(device.Id);
        return new ReliableIoResult(true, null);
    }
}

public record ReliableIoResult(bool Accepted, FaultRecordDto? Fault);
