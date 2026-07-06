using System;
using System.Threading;
using System.Threading.Tasks;
using Project2.Core;

namespace Project2
{
    internal static class Program
    {
        private static void Main(string[] args)
        {
            MainAsync(args).GetAwaiter().GetResult();
        }

        private static async Task MainAsync(string[] args)
        {
            using (var cts = new CancellationTokenSource())
            {
                Console.CancelKeyPress += (sender, eventArgs) =>
                {
                    eventArgs.Cancel = true;
                    cts.Cancel();
                };

                var runtime = ScadaRuntime.Create();
                var background = runtime.StartAsync(cts.Token);

                if (args.Length > 0 && string.Equals(args[0], "stability-test", StringComparison.OrdinalIgnoreCase))
                {
                    var harness = new StabilityTestHarness(runtime);
                    await harness.RunAsync(1000, TimeSpan.FromSeconds(10), cts.Token).ConfigureAwait(false);
                    cts.Cancel();
                    await StopBackgroundAsync(background).ConfigureAwait(false);
                    return;
                }

                if (args.Length > 0 &&
                    (string.Equals(args[0], "gateway-test", StringComparison.OrdinalIgnoreCase) ||
                     string.Equals(args[0], "saas-test", StringComparison.OrdinalIgnoreCase)))
                {
                    var harness = new StabilityTestHarness(runtime);
                    await harness.RunSaasAsync(2, 1000, TimeSpan.FromSeconds(10), cts.Token).ConfigureAwait(false);
                    cts.Cancel();
                    await StopBackgroundAsync(background).ConfigureAwait(false);
                    return;
                }

                runtime.Logger.Info("V7 Industrial Gateway Core started.");
                runtime.Logger.Info("Run with argument 'gateway-test' to execute the gateway acceptance simulation.");

                while (!cts.Token.IsCancellationRequested)
                {
                    try
                    {
                        await Task.Delay(1000, cts.Token).ConfigureAwait(false);
                    }
                    catch (OperationCanceledException)
                    {
                        break;
                    }
                }

                await StopBackgroundAsync(background).ConfigureAwait(false);
            }
        }

        private static async Task StopBackgroundAsync(Task background)
        {
            try
            {
                await background.ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
            }
            catch (Exception)
            {
                if (!background.IsCanceled && !background.IsFaulted)
                {
                    throw;
                }
            }
        }
    }
}
