using Microsoft.Extensions.Hosting;

namespace V7Backend.Services;

public class IoSchedulerWorker : BackgroundService
{
    private readonly IoScheduler _scheduler;

    public IoSchedulerWorker(IoScheduler scheduler)
    {
        _scheduler = scheduler;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await _scheduler.RunCycleAsync(null, stoppingToken);
            await Task.Delay(500, stoppingToken);
        }
    }
}
