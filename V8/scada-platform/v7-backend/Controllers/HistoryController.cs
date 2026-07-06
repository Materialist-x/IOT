using Microsoft.AspNetCore.Mvc;
using V7Backend.Services;

namespace V7Backend.Controllers;

[ApiController]
[Route("api/history")]
public class HistoryController : ControllerBase
{
    private readonly HistorianService _historian;

    public HistoryController(HistorianService historian)
    {
        _historian = historian;
    }

    [HttpGet]
    public IActionResult Get([FromQuery] string? tagId, [FromQuery] DateTimeOffset? from, [FromQuery] DateTimeOffset? to)
    {
        return Ok(_historian.Query(tagId, from, to));
    }
}
