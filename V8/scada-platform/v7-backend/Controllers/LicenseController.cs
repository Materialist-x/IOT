using Microsoft.AspNetCore.Mvc;
using V7Backend.Services;

namespace V7Backend.Controllers;

[ApiController]
[Route("api/license")]
public class LicenseController : ControllerBase
{
    private readonly LicenseService _licenses;
    private readonly TagEngineService _tagEngine;

    public LicenseController(LicenseService licenses, TagEngineService tagEngine)
    {
        _licenses = licenses;
        _tagEngine = tagEngine;
    }

    [HttpGet]
    public IActionResult Get()
    {
        return Ok(_licenses.GetCurrent());
    }

    [HttpPost("activate")]
    public async Task<IActionResult> Activate([FromBody] LicenseActivateRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var license = _licenses.Activate(request.Key ?? string.Empty);
            await _tagEngine.BroadcastLicenseAsync(license, cancellationToken);
            return Ok(license);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("session")]
    public IActionResult CreateSession([FromBody] LicenseSessionRequest request)
    {
        return Ok(new
        {
            sessionId = Guid.NewGuid().ToString("N"),
            status = string.IsNullOrWhiteSpace(request.Key) ? "trial" : "valid",
            issuedAt = DateTimeOffset.UtcNow
        });
    }
}
