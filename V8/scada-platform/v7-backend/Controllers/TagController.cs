using Microsoft.AspNetCore.Mvc;
using V7Backend.Services;

namespace V7Backend.Controllers;

[ApiController]
[Route("api/tag")]
public class TagController : ControllerBase
{
    private readonly TagService _tags;

    public TagController(TagService tags)
    {
        _tags = tags;
    }

    [HttpGet]
    public IActionResult GetAll()
    {
        return Ok(_tags.GetAll());
    }

    [HttpGet("{deviceId}")]
    public IActionResult Get(string deviceId)
    {
        return Ok(_tags.GetByDevice(deviceId));
    }
}
