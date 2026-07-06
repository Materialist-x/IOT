namespace V7Backend.Services;

public class AlarmService
{
    private readonly object _lock = new();
    private readonly List<AlarmRuleDto> _rules = [];
    private readonly List<AlarmRecordDto> _records = [];

    public IReadOnlyList<AlarmRuleDto> GetRules()
    {
        lock (_lock)
        {
            return _rules.ToArray();
        }
    }

    public IReadOnlyList<AlarmRecordDto> GetRecords()
    {
        lock (_lock)
        {
            return _records.ToArray();
        }
    }

    public AlarmRuleDto AddRule(CreateAlarmRuleRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.TagId))
        {
            throw new ArgumentException("Tag id is required.");
        }

        if (!SupportedConditions.Contains(request.Condition))
        {
            throw new ArgumentException("Condition must be one of >, >=, <, <=.");
        }

        lock (_lock)
        {
            var rule = new AlarmRuleDto(
                Guid.NewGuid().ToString("N"),
                request.TagId.Trim(),
                request.Condition,
                request.Threshold,
                true);
            _rules.Insert(0, rule);
            return rule;
        }
    }

    public AlarmRecordDto Trigger(TriggerAlarmRequest request, TagDto tag)
    {
        var value = request.Value ?? request.Threshold + 1;
        return AddRecord(tag, value, request.Threshold, request.Condition, "manual");
    }

    public AlarmRecordDto? Evaluate(TagDto tag, double value)
    {
        lock (_lock)
        {
            var matchedRule = _rules.FirstOrDefault(rule =>
                rule.Enabled &&
                rule.TagId.Equals(tag.Id, StringComparison.OrdinalIgnoreCase) &&
                Match(rule.Condition, value, rule.Threshold));

            if (matchedRule is null)
            {
                return null;
            }

            return AddRecordLocked(tag, value, matchedRule.Threshold, matchedRule.Condition, "auto");
        }
    }

    private AlarmRecordDto AddRecord(TagDto tag, double value, double threshold, string condition, string source)
    {
        lock (_lock)
        {
            return AddRecordLocked(tag, value, threshold, condition, source);
        }
    }

    private AlarmRecordDto AddRecordLocked(TagDto tag, double value, double threshold, string condition, string source)
    {
        var record = new AlarmRecordDto(
            Guid.NewGuid().ToString("N"),
            tag.Id,
            tag.DeviceId,
            tag.Name,
            value,
            threshold,
            condition,
            "critical",
            source,
            DateTimeOffset.UtcNow);

        _records.Insert(0, record);
        if (_records.Count > 200)
        {
            _records.RemoveRange(200, _records.Count - 200);
        }

        return record;
    }

    private static bool Match(string condition, double value, double threshold)
    {
        return condition switch
        {
            ">" => value > threshold,
            ">=" => value >= threshold,
            "<" => value < threshold,
            "<=" => value <= threshold,
            _ => false
        };
    }

    private static readonly HashSet<string> SupportedConditions = [">", ">=", "<", "<="];
}

public record AlarmRuleDto(string Id, string TagId, string Condition, double Threshold, bool Enabled);

public record AlarmRecordDto(
    string Id,
    string TagId,
    string DeviceId,
    string TagName,
    double Value,
    double Threshold,
    string Condition,
    string Level,
    string Source,
    DateTimeOffset Time);

public record CreateAlarmRuleRequest(string TagId, string Condition, double Threshold);

public record TriggerAlarmRequest(string TagId, string Condition, double Threshold, double? Value);
