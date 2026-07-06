using Microsoft.AspNetCore.Mvc;
using V7Backend.Services;

namespace V7Backend.Controllers;

[ApiController]
[Route("api/alarm")]
public class AlarmController : ControllerBase
{
    private readonly AlarmService _alarms;
    private readonly TagService _tags;

    public AlarmController(AlarmService alarms, TagService tags)
    {
        _alarms = alarms;
        _tags = tags;
    }

    [HttpGet("rules")]
    public IActionResult GetRules()
    {
        return Ok(_alarms.GetRules());
    }

    [HttpPost("rules")]
    public IActionResult CreateRule([FromBody] CreateAlarmRuleRequest request)
    {
        try
        {
            return Ok(_alarms.AddRule(request));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("records")]
    public IActionResult GetRecords()
    {
        return Ok(_alarms.GetRecords());
    }

    [HttpPost("trigger")]
    public IActionResult Trigger([FromBody] TriggerAlarmRequest request)
    {
        var tag = _tags.GetById(request.TagId);
        if (tag is null)
        {
            return NotFound(new { message = "Tag was not found." });
        }

        return Ok(_alarms.Trigger(request, tag));
    }
}
