namespace V7Backend.Services;

public class TagService
{
    private readonly object _lock = new();
    private readonly List<TagDto> _tags = [];

    public IReadOnlyList<TagDto> GetAll()
    {
        lock (_lock)
        {
            return _tags.OrderBy(tag => tag.DeviceId).ThenBy(tag => tag.Name).ToArray();
        }
    }

    public IReadOnlyList<TagDto> GetByDevice(string deviceId)
    {
        lock (_lock)
        {
            return _tags.Where(tag => tag.DeviceId.Equals(deviceId, StringComparison.OrdinalIgnoreCase)).ToArray();
        }
    }

    public TagDto? GetById(string tagId)
    {
        lock (_lock)
        {
            return _tags.FirstOrDefault(tag => tag.Id.Equals(tagId, StringComparison.OrdinalIgnoreCase));
        }
    }

    public IReadOnlyList<TagDto> UpsertForDevice(DeviceDto device)
    {
        lock (_lock)
        {
            var definitions = BuildDefinitions(device);
            var current = _tags.Where(tag => tag.DeviceId.Equals(device.Id, StringComparison.OrdinalIgnoreCase))
                .ToDictionary(tag => tag.Id, tag => tag, StringComparer.OrdinalIgnoreCase);

            _tags.RemoveAll(tag => tag.DeviceId.Equals(device.Id, StringComparison.OrdinalIgnoreCase));

            var merged = definitions.Select(definition =>
            {
                if (!current.TryGetValue(definition.Id, out var existing))
                {
                    return definition;
                }

                return definition with
                {
                    Value = existing.Value,
                    Quality = existing.Quality,
                    LastUpdate = existing.LastUpdate
                };
            }).ToArray();

            _tags.AddRange(merged);
            return merged;
        }
    }

    public TagDto UpdateValue(string tagId, double value, string quality)
    {
        lock (_lock)
        {
            var index = _tags.FindIndex(tag => tag.Id.Equals(tagId, StringComparison.OrdinalIgnoreCase));
            if (index < 0)
            {
                throw new InvalidOperationException($"Tag {tagId} was not found.");
            }

            var updated = _tags[index] with
            {
                Value = value,
                Quality = quality,
                LastUpdate = DateTimeOffset.UtcNow
            };

            _tags[index] = updated;
            return updated;
        }
    }

    private static IReadOnlyList<TagDto> BuildDefinitions(DeviceDto device)
    {
        return device.TagDefinitions.Select(definition => new TagDto(
            $"{device.Id}:{definition.Key}".ToLowerInvariant(),
            device.Id,
            definition.Name,
            definition.Address,
            definition.Scale,
            null,
            "UNCERTAIN",
            DateTimeOffset.MinValue)).ToArray();
    }
}

public record TagDto(
    string Id,
    string DeviceId,
    string Name,
    string Address,
    double Scale,
    double? Value,
    string Quality,
    DateTimeOffset LastUpdate);
