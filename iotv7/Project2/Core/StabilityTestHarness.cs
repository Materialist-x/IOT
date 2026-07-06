using System;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Project2.Models;

namespace Project2.Core
{
    public sealed class StabilityTestHarness
    {
        private readonly ScadaRuntime _runtime;

        public StabilityTestHarness(ScadaRuntime runtime)
        {
            _runtime = runtime;
        }

        public async Task RunAsync(int deviceCount, TimeSpan duration, CancellationToken cancellationToken)
        {
            await RunSaasAsync(2, deviceCount, duration, cancellationToken).ConfigureAwait(false);
        }

        public async Task RunSaasAsync(int tenantCount, int devicesPerTenant, TimeSpan duration, CancellationToken cancellationToken)
        {
            var startedAt = DateTime.UtcNow;
            var totalMessages = 0;

            for (var tenantIndex = 0; tenantIndex < tenantCount; tenantIndex++)
            {
                var tenantId = BuildTenantId(tenantIndex);
                _runtime.TenantResolver.RegisterTenant(new Tenant
                {
                    TenantId = tenantId,
                    TenantName = "Tenant " + tenantIndex,
                    Status = TenantStatus.Active,
                    ExpireTime = DateTime.UtcNow.AddHours(1),
                    PlanType = PlanType.Enterprise
                });

                _runtime.LicenseService.CheckOnConnect(tenantId, "bootstrap");

                for (var i = 0; i < devicesPerTenant; i++)
                {
                    var deviceId = BuildDeviceId(i);
                    _runtime.TenantResolver.RegisterDevice(tenantId, deviceId);
                    _runtime.BillingEngine.TryRegisterDevice(tenantId, deviceId);
                }
            }

            while (DateTime.UtcNow - startedAt < duration && !cancellationToken.IsCancellationRequested)
            {
                for (var tenantIndex = 0; tenantIndex < tenantCount; tenantIndex++)
                {
                    var tenantId = BuildTenantId(tenantIndex);
                    for (var i = 0; i < devicesPerTenant; i++)
                    {
                        var deviceId = BuildDeviceId(i);
                        var payload = Encoding.UTF8.GetBytes(
                            "{\"tenantId\":\"" + tenantId + "\",\"deviceId\":\"" + deviceId + "\",\"tags\":{\"Temperature\":" + (20 + i % 20) + ",\"Pressure\":" + (100 + i % 10) + "}}");
                        var message = new IncomingTcpMessage(
                            tenantId,
                            deviceId,
                            "sim-session",
                            payload,
                            MessageKind.Data,
                            DateTime.UtcNow);

                        _runtime.ChannelQueue.Enqueue(message);
                        totalMessages++;

                        if (i % 10 == 0)
                        {
                            _runtime.ChannelQueue.Enqueue(new IncomingTcpMessage(
                                tenantId,
                                deviceId,
                                "sim-session",
                                Encoding.ASCII.GetBytes("PING"),
                                MessageKind.Heartbeat,
                                DateTime.UtcNow));
                        }
                    }
                }

                await Task.Delay(100, cancellationToken).ConfigureAwait(false);
            }

            await _runtime.BatchWriter.FlushOnceAsync(cancellationToken).ConfigureAwait(false);
            var expiredTenant = BuildTenantId(tenantCount - 1);
            _runtime.TenantResolver.ExpireTenant(expiredTenant);
            _runtime.LicenseService.ExpireTenant(expiredTenant);
            _runtime.ChannelQueue.Enqueue(new IncomingTcpMessage(
                expiredTenant,
                BuildDeviceId(0),
                "sim-session",
                Encoding.ASCII.GetBytes("PING"),
                MessageKind.Heartbeat,
                DateTime.UtcNow));
            await Task.Delay(100, cancellationToken).ConfigureAwait(false);

            _runtime.Logger.Info("Gateway stability simulation sent " + totalMessages + " data messages.");
            _runtime.Logger.Info("Influx history stored " + _runtime.InfluxService.Count + " tag values.");
            for (var tenantIndex = 0; tenantIndex < tenantCount; tenantIndex++)
            {
                var tenantId = BuildTenantId(tenantIndex);
                _runtime.Logger.Info("Tenant " + tenantId + " stored " + _runtime.InfluxService.CountTenant(tenantId) + " tag values.");
                _runtime.Logger.Info("Tenant " + tenantId + " registered devices " + _runtime.BillingEngine.GetDeviceCount(tenantId) + ".");
            }
            _runtime.Logger.Info("Expired tenant " + expiredTenant + " queue length " + _runtime.ChannelQueue.GetLength(expiredTenant, BuildDeviceId(0)) + ".");
        }

        private static string BuildTenantId(int tenantIndex)
        {
            return "TENANT-" + tenantIndex.ToString("000");
        }

        private static string BuildDeviceId(int deviceIndex)
        {
            return "SIM-" + deviceIndex.ToString("0000");
        }
    }
}
