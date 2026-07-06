namespace V7Backend.Services;

public interface IFrameValidator
{
    bool Validate(byte[] frame, DeviceDto device, out string reason);
}
