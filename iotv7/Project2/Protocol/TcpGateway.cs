using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Project2.Core;
using Project2.Models;

namespace Project2.Protocol
{
    public sealed class TcpGateway
    {
        private readonly LicenseService _license;
        private readonly SessionManager _session;
        private readonly ProtocolDispatcher _dispatcher;
        private readonly TagEngine _tagEngine;

        public TcpGateway(
            LicenseService license,
            SessionManager session,
            ProtocolDispatcher dispatcher,
            TagEngine tagEngine)
        {
            _license = license;
            _session = session;
            _dispatcher = dispatcher;
            _tagEngine = tagEngine;
        }

        public async Task OnReceiveAsync(
            string tenantId,
            string deviceId,
            byte[] data,
            string licenseCode,
            CancellationToken cancellationToken)
        {
            if (!_license.CheckOnConnect(tenantId, deviceId))
            {
                _session.MarkOffline(tenantId, deviceId);
                return;
            }

            var message = new IncomingTcpMessage(
                tenantId,
                deviceId,
                "gateway-" + Guid.NewGuid().ToString("N"),
                data,
                MessageKind.Data,
                DateTime.UtcNow);

            IReadOnlyList<TagValue> tags = _dispatcher.Dispatch(message);
            await _tagEngine.ProcessAsync(tags, cancellationToken).ConfigureAwait(false);
        }
    }
}
