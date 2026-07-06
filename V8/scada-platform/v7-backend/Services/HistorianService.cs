namespace V7Backend.Services;

public class HistorianService
{
    private readonly object _lock = new();
    private readonly List<HistoryPointDto> _points = [];

    public void Append(TagDto tag, double value)
    {
        BatchAppend([new HistoryPointDto(tag.Id, tag.DeviceId, tag.Name, value, DateTimeOffset.UtcNow)]);
    }

    public void BatchAppend(IReadOnlyList<HistoryPointDto> points)
    {
        lock (_lock)
        {
            _points.AddRange(points);

            if (_points.Count > 5000)
            {
                _points.RemoveRange(0, _points.Count - 5000);
            }
        }
    }

    public IReadOnlyList<HistoryPointDto> Query(string? tagId, DateTimeOffset? from, DateTimeOffset? to)
    {
        lock (_lock)
        {
            return _points
                .Where(point => string.IsNullOrWhiteSpace(tagId) || point.TagId.Equals(tagId, StringComparison.OrdinalIgnoreCase))
                .Where(point => !from.HasValue || point.Timestamp >= from.Value)
                .Where(point => !to.HasValue || point.Timestamp <= to.Value)
                .OrderBy(point => point.Timestamp)
                .ToArray();
        }
    }
}

public record HistoryPointDto(
    string TagId,
    string DeviceId,
    string TagName,
    double Value,
    DateTimeOffset Timestamp);
