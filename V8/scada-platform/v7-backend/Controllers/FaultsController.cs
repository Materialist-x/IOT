using Microsoft.AspNetCore.Mvc;
using V7Backend.Services;

namespace V7Backend.Controllers;

[ApiController]
[Route("api/faults")]
public class FaultsController : ControllerBase
{
    private readonly FaultEngine _faults;

    public FaultsController(FaultEngine faults)
    {
        _faults = faults;
    }

    [HttpGet]
    public IActionResult Get()
    {
        return Ok(_faults.GetAll());
    }
}
