using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.SignalR;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy => policy
        .AllowAnyHeader()
        .AllowAnyMethod()
        .SetIsOriginAllowed(_ => true)
        .AllowCredentials());
});
builder.Services.AddSignalR();
builder.Services.AddHostedService<RabbitMqRealtimeWorker>();

var app = builder.Build();
app.UseCors();
app.MapGet("/health", () => Results.Ok(new { status = "ok", service = "signalr-service" }));
app.MapHub<TenantTagHub>("/tenant/{tenantId}/tags");
app.Run();

public sealed class TenantTagHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var tenantId = Context.GetHttpContext()?.Request.RouteValues["tenantId"]?.ToString();
        if (!string.IsNullOrWhiteSpace(tenantId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, TenantGroup(tenantId));
        }
        await base.OnConnectedAsync();
    }

    public static string TenantGroup(string tenantId) => $"tenant:{tenantId}";
}

public sealed class RabbitMqRealtimeWorker : BackgroundService
{
    private readonly IHubContext<TenantTagHub> hub;
    private readonly ILogger<RabbitMqRealtimeWorker> logger;
    private IConnection? connection;
    private IModel? channel;

    public RabbitMqRealtimeWorker(IHubContext<TenantTagHub> hub, ILogger<RabbitMqRealtimeWorker> logger)
    {
        this.hub = hub;
        this.logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Task.Yield();
        var uri = Environment.GetEnvironmentVariable("RABBITMQ_URL") ?? "amqp://v8:v8_password@message-broker:5672";
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var factory = new ConnectionFactory { Uri = new Uri(uri), DispatchConsumersAsync = true };
                connection = factory.CreateConnection();
                channel = connection.CreateModel();

                channel.ExchangeDeclare("v8.processed.telemetry", ExchangeType.Topic, durable: true);
                channel.ExchangeDeclare("v8.alarms", ExchangeType.Topic, durable: true);

                BindConsumer("signalr.tags", "v8.processed.telemetry", "tag.processed", "tag", stoppingToken);
                BindConsumer("signalr.alarms", "v8.alarms", "alarm.raised", "alarm", stoppingToken);

                logger.LogInformation("signalr-service consuming processed realtime events");
                return;
            }
            catch (Exception error)
            {
                logger.LogWarning(error, "RabbitMQ unavailable; SignalR service will retry");
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
        }
    }

    private void BindConsumer(string queue, string exchange, string routingKey, string eventName, CancellationToken stoppingToken)
    {
        if (channel is null) return;

        channel.QueueDeclare(queue, durable: true, exclusive: false, autoDelete: false);
        channel.QueueBind(queue, exchange, routingKey);

        var consumer = new AsyncEventingBasicConsumer(channel);
        consumer.Received += async (_, args) =>
        {
            try
            {
                var json = Encoding.UTF8.GetString(args.Body.ToArray());
                using var document = JsonDocument.Parse(json);
                var tenantId = document.RootElement.GetProperty("tenantId").GetString();
                if (!string.IsNullOrWhiteSpace(tenantId))
                {
                    await hub.Clients.Group(TenantTagHub.TenantGroup(tenantId)).SendAsync(eventName, json, stoppingToken);
                }
                channel.BasicAck(args.DeliveryTag, false);
            }
            catch (Exception error)
            {
                logger.LogError(error, "failed to push realtime event");
                channel.BasicNack(args.DeliveryTag, false, false);
            }
        };

        channel.BasicConsume(queue, autoAck: false, consumer);
    }

    public override void Dispose()
    {
        channel?.Dispose();
        connection?.Dispose();
        base.Dispose();
    }
}
