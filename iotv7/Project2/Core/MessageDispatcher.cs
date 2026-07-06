using System.Threading;
using System.Threading.Tasks;
using Project2.Models;

namespace Project2.Core
{
    public sealed class MessageDispatcher
    {
        private readonly IMessageBus _messageBus;
        private readonly SessionManager _sessionManager;
        private readonly LicenseService _licenseService;
        private readonly IChannelQueue _channelQueue;
        private readonly TenantResolver _tenantResolver;
        private readonly BillingEngine _billingEngine;
        private readonly RateLimiter _rateLimiter;

        public MessageDispatcher(
            IMessageBus messageBus,
            SessionManager sessionManager,
            LicenseService licenseService,
            IChannelQueue channelQueue,
            TenantResolver tenantResolver,
            BillingEngine billingEngine,
            RateLimiter rateLimiter)
        {
            _messageBus = messageBus;
            _sessionManager = sessionManager;
            _licenseService = licenseService;
            _channelQueue = channelQueue;
            _tenantResolver = tenantResolver;
            _billingEngine = billingEngine;
            _rateLimiter = rateLimiter;
        }

        public async Task DispatchAsync(IncomingTcpMessage message, CancellationToken cancellationToken)
        {
            if (!_tenantResolver.IsTenantActive(message.TenantId))
            {
                TerminateTenant(message.TenantId);
                return;
            }

            if (message.Kind == MessageKind.Heartbeat && !_licenseService.CheckOnHeartbeat(message.TenantId))
            {
                TerminateTenant(message.TenantId);
                return;
            }

            if (!_licenseService.IsCachedValid(message.TenantId))
            {
                TerminateTenant(message.TenantId);
                return;
            }

            if (!_billingEngine.RecordThroughput(message.TenantId, message.Payload.Length))
            {
                if (message.Kind != MessageKind.Alarm)
                {
                    return;
                }
            }

            if (!_rateLimiter.Allow(message))
            {
                return;
            }

            _sessionManager.Touch(message.TenantId, message.DeviceId);
            await _messageBus.PublishAsync(message, cancellationToken).ConfigureAwait(false);
        }

        private void TerminateDevice(string tenantId, string deviceId)
        {
            DeviceSession session;
            if (_sessionManager.TryGet(tenantId, deviceId, out session) && session.Connection != null)
            {
                session.Connection.Close();
            }

            _sessionManager.MarkOffline(tenantId, deviceId);
            _channelQueue.StopDevice(tenantId, deviceId);
        }

        private void TerminateTenant(string tenantId)
        {
            _sessionManager.MarkTenantOffline(tenantId);
            _channelQueue.StopTenant(tenantId);
        }
    }
}
