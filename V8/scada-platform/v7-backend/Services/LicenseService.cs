namespace V7Backend.Services;

public class LicenseService
{
    private readonly object _lock = new();
    private LicenseInfo _current = CreateDefault();

    public LicenseInfo GetCurrent()
    {
        lock (_lock)
        {
            return _current;
        }
    }

    public LicenseInfo Activate(string key)
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            throw new ArgumentException("License key is required.");
        }

        lock (_lock)
        {
            var normalized = key.Trim();
            var enterprise = normalized.StartsWith("ENT", StringComparison.OrdinalIgnoreCase);

            _current = _current with
            {
                Status = "ACTIVE",
                Type = enterprise ? "MULTI" : "SINGLE",
                MaxDevices = enterprise ? 128 : 3,
                LicenseKey = MaskKey(normalized),
                ExpiresAt = DateTimeOffset.UtcNow.AddDays(365),
                Features = enterprise
                    ? new LicenseFeatures(true, true, true, true, true)
                    : new LicenseFeatures(true, true, true, false, false)
            };

            return _current;
        }
    }

    public LicenseInfo UpdateActiveDevices(int activeDevices)
    {
        lock (_lock)
        {
            _current = _current with { ActiveDevices = activeDevices };
            return _current;
        }
    }

    private static string MaskKey(string key)
    {
        return key.Length <= 8 ? "****" : $"{key[..4]}****{key[^4..]}";
    }

    private static LicenseInfo CreateDefault()
    {
        return new LicenseInfo(
            "ACTIVE",
            "TRIAL",
            1,
            0,
            DateTimeOffset.UtcNow.AddDays(365),
            "V8-TRIAL-0001",
            "HASH_VM_001",
            new LicenseFeatures(true, true, true, false, false));
    }
}

public record LicenseInfo(
    string Status,
    string Type,
    int MaxDevices,
    int ActiveDevices,
    DateTimeOffset ExpiresAt,
    string LicenseKey,
    string MachineId,
    LicenseFeatures Features);

public record LicenseFeatures(
    bool ScadaDashboard,
    bool DeviceManagement,
    bool AlarmSystem,
    bool MultiDevice,
    bool Historian);

public record LicenseActivateRequest(string? Key);

public record LicenseSessionRequest(string? Key);
