namespace V7Backend.Services;

public class DeviceService
{
    private readonly object _lock = new();
    private readonly List<DeviceDto> _devices = [];

    public IReadOnlyList<DeviceDto> GetAll()
    {
        lock (_lock)
        {
            return _devices.OrderBy(device => device.Name).ToArray();
        }
    }

    public DeviceDto? Get(string deviceId)
    {
        lock (_lock)
        {
            return _devices.FirstOrDefault(device => device.Id.Equals(deviceId, StringComparison.OrdinalIgnoreCase));
        }
    }

    public DeviceDto Upsert(CreateDeviceRequest request)
    {
        Validate(request);

        lock (_lock)
        {
            var existingIndex = _devices.FindIndex(device => device.Id.Equals(request.Id, StringComparison.OrdinalIgnoreCase));
            var existing = existingIndex >= 0 ? _devices[existingIndex] : null;
            var device = BuildDevice(request, existing);

            if (existingIndex >= 0)
            {
                _devices[existingIndex] = device;
                return device;
            }

            _devices.Add(device);
            return device;
        }
    }

    public void Touch(string deviceId, string status)
    {
        lock (_lock)
        {
            var index = _devices.FindIndex(device => device.Id.Equals(deviceId, StringComparison.OrdinalIgnoreCase));
            if (index < 0)
            {
                return;
            }

            var current = _devices[index];
            _devices[index] = current with
            {
                Status = NormalizeStatus(status),
                LastSeen = DateTimeOffset.UtcNow
            };
        }
    }

    public void SetStatus(string deviceId, string status)
    {
        Touch(deviceId, status);
    }

    private static void Validate(CreateDeviceRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Id) || string.IsNullOrWhiteSpace(request.Name))
        {
            throw new ArgumentException("Device id and name are required.");
        }

        if (string.IsNullOrWhiteSpace(request.DeviceNo))
        {
            throw new ArgumentException("Device number is required.");
        }

        if (string.IsNullOrWhiteSpace(request.LicenseCode))
        {
            throw new ArgumentException("License code is required.");
        }
    }

    private static DeviceDto BuildDevice(CreateDeviceRequest request, DeviceDto? existing)
    {
        var normalizedProtocol = NormalizeProtocol(request.Protocol);
        var tagDefinitions = BuildTagDefinitions(request, existing, normalizedProtocol);

        return new DeviceDto(
            request.Id.Trim(),
            request.Name.Trim(),
            request.DeviceNo.Trim(),
            NormalizeStatus(existing?.Status ?? "ONLINE"),
            normalizedProtocol,
            request.LicenseCode.Trim(),
            string.IsNullOrWhiteSpace(request.Host) ? (existing?.Host ?? "127.0.0.1") : request.Host.Trim(),
            request.Port is > 0 ? request.Port.Value : (existing?.Port ?? 15020),
            string.IsNullOrWhiteSpace(request.ModbusStation) ? "1" : request.ModbusStation.Trim(),
            string.IsNullOrWhiteSpace(request.RegisterAddress) ? "40010" : request.RegisterAddress.Trim(),
            request.PollIntervalMs is > 0 ? request.PollIntervalMs.Value : (existing?.PollIntervalMs ?? 1000),
            request.JsonMappings ?? [],
            tagDefinitions,
            DateTimeOffset.UtcNow);
    }

    private static IReadOnlyList<TagDefinitionDto> BuildTagDefinitions(CreateDeviceRequest request, DeviceDto? existing, string protocol)
    {
        if (request.TagDefinitions is { Count: > 0 })
        {
            return request.TagDefinitions
                .Where(definition => !string.IsNullOrWhiteSpace(definition.Name) && !string.IsNullOrWhiteSpace(definition.Address))
                .Select((definition, index) => NormalizeTagDefinition(definition, index, protocol))
                .ToArray();
        }

        if (existing is { TagDefinitions.Count: > 0 })
        {
            return existing.TagDefinitions;
        }

        if (request.JsonMappings is { Count: > 0 })
        {
            return request.JsonMappings.Select((entry, index) =>
                new TagDefinitionDto(
                    BuildTagKey(entry.Key, index),
                    entry.Key.Trim(),
                    entry.Value.Trim(),
                    1d)).ToArray();
        }

        var baseRegister = ParseRegister(request.RegisterAddress);
        return
        [
            new TagDefinitionDto("temp", "Temp", baseRegister.ToString(), 0.1d),
            new TagDefinitionDto("pressure", "Pressure", (baseRegister + 1).ToString(), 0.01d)
        ];
    }

    private static TagDefinitionDto NormalizeTagDefinition(TagDefinitionDto definition, int index, string protocol)
    {
        var key = string.IsNullOrWhiteSpace(definition.Key)
            ? BuildTagKey(definition.Name, index)
            : definition.Key.Trim();
        var name = definition.Name.Trim();
        var address = definition.Address.Trim();
        var scale = definition.Scale == 0 ? InferScale(protocol, name) : definition.Scale;

        return new TagDefinitionDto(key, name, address, scale);
    }

    private static string BuildTagKey(string raw, int index)
    {
        var normalized = raw.Trim().ToLowerInvariant()
            .Replace(" ", "-", StringComparison.Ordinal)
            .Replace("_", "-", StringComparison.Ordinal);
        return string.IsNullOrWhiteSpace(normalized) ? $"tag-{index + 1}" : normalized;
    }

    private static double InferScale(string protocol, string name)
    {
        if (protocol.Equals("ModbusTCP", StringComparison.OrdinalIgnoreCase))
        {
            return name.Equals("Pressure", StringComparison.OrdinalIgnoreCase) ? 0.01d : 0.1d;
        }

        return 1d;
    }

    private static int ParseRegister(string? raw)
    {
        return int.TryParse(raw, out var value) && value > 0 ? value : 40010;
    }

    private static string NormalizeStatus(string raw)
    {
        return raw.ToUpperInvariant();
    }

    private static string NormalizeProtocol(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return "ModbusTCP";
        }

        return raw.Replace(" ", string.Empty, StringComparison.OrdinalIgnoreCase);
    }
}

public record DeviceDto(
    string Id,
    string Name,
    string DeviceNo,
    string Status,
    string Protocol,
    string LicenseCode,
    string Host,
    int Port,
    string ModbusStation,
    string RegisterAddress,
    int PollIntervalMs,
    IReadOnlyDictionary<string, string> JsonMappings,
    IReadOnlyList<TagDefinitionDto> TagDefinitions,
    DateTimeOffset LastSeen);

public record CreateDeviceRequest(
    string Id,
    string Name,
    string DeviceNo,
    string? Protocol,
    string LicenseCode,
    string? Host,
    int? Port,
    string? ModbusStation,
    string? RegisterAddress,
    int? PollIntervalMs,
    Dictionary<string, string>? JsonMappings,
    List<TagDefinitionDto>? TagDefinitions);

public record TagDefinitionDto(
    string Key,
    string Name,
    string Address,
    double Scale);
