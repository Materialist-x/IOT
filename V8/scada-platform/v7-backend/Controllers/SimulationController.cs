using Microsoft.AspNetCore.Mvc;
using V7Backend.Services;

namespace V7Backend.Controllers;

[ApiController]
[Route("api/simulation")]
public class SimulationController : ControllerBase
{
    private readonly TcpSimulationService _simulation;

    public SimulationController(TcpSimulationService simulation)
    {
        _simulation = simulation;
    }

    [HttpPost("tcp")]
    public async Task<IActionResult> RunTcp([FromBody] RunTcpSimulationRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.ActivationCode))
        {
            return BadRequest(new { message = "Activation code is required." });
        }

        if (string.IsNullOrWhiteSpace(request.DeviceId) || string.IsNullOrWhiteSpace(request.DeviceName))
        {
            return BadRequest(new { message = "Device id and name are required." });
        }

        var result = await _simulation.RunAsync(request, cancellationToken);
        return Ok(result);
    }
}
