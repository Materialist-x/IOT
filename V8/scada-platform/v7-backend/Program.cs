using V7Backend.Services;
using V7Backend.WebSocket;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSingleton<DeviceService>();
builder.Services.AddSingleton<TagService>();
builder.Services.AddSingleton<AlarmService>();
builder.Services.AddSingleton<LicenseService>();
builder.Services.AddSingleton<HistorianService>();
builder.Services.AddSingleton<TagEngineService>();
builder.Services.AddSingleton<EdgeBufferService>();
builder.Services.AddHttpClient<CloudBridgeService>();
builder.Services.AddSingleton<DeviceClientPool>();
builder.Services.AddSingleton<DeviceHealthMonitor>();
builder.Services.AddSingleton<FaultEngine>();
builder.Services.AddSingleton<IFrameValidator, FrameValidator>();
builder.Services.AddSingleton<IProtocolHandler, ModbusTcpProtocolHandler>();
builder.Services.AddSingleton<IProtocolHandler, Dlt645ProtocolHandler>();
builder.Services.AddSingleton<IProtocolHandler, JsonProtocolHandler>();
builder.Services.AddSingleton<ProtocolHandlerRegistry>();
builder.Services.AddSingleton<ReliableIoPipeline>();
builder.Services.AddSingleton<IoManager>();
builder.Services.AddSingleton<IoScheduler>();
builder.Services.AddSingleton<DevicePollingWorker>();
builder.Services.AddSingleton<PollingScheduler>();
builder.Services.AddSingleton<TcpSimulationService>();
builder.Services.AddSingleton<WsHub>();
builder.Services.AddHostedService<LoopbackIoSimulatorService>();
builder.Services.AddHostedService<IoSchedulerWorker>();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();

app.UseCors();
app.UseWebSockets();
app.UseSwagger();
app.UseSwaggerUI();
app.MapControllers();

app.MapGet("/", () => Results.Ok(new
{
    service = "V7 Industrial IoT Backend",
    status = "running",
    endpoints = new[]
    {
        "/swagger",
        "/health",
        "/api/device",
        "/api/tag",
        "/api/history?tagId=pump-01:temp",
        "/api/license",
        "/api/simulation/tcp",
        "/ws"
    }
}));

app.MapGet("/health", () => Results.Ok(new
{
    status = "healthy",
    time = DateTimeOffset.UtcNow
}));

app.Map("/ws", async context =>
{
    if (!context.WebSockets.IsWebSocketRequest)
    {
        context.Response.StatusCode = StatusCodes.Status400BadRequest;
        return;
    }

    var hub = context.RequestServices.GetRequiredService<WsHub>();
    using var socket = await context.WebSockets.AcceptWebSocketAsync();
    await hub.AddAndListenAsync(socket, context.RequestAborted);
});

app.Run("http://0.0.0.0:9000");
