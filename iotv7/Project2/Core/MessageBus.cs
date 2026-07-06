using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Project2.Models;

namespace Project2.Core
{
    public sealed class MessageBus : IMessageBus
    {
        private readonly ProtocolEngine _protocolEngine;
        private readonly TagEngine _tagEngine;

        public MessageBus(ProtocolEngine protocolEngine, TagEngine tagEngine)
        {
            _protocolEngine = protocolEngine;
            _tagEngine = tagEngine;
        }

        public async Task PublishAsync(IncomingTcpMessage message, CancellationToken cancellationToken)
        {
            IReadOnlyList<TagValue> values = _protocolEngine.Decode(message);
            await _tagEngine.ProcessAsync(values, cancellationToken).ConfigureAwait(false);
        }
    }
}
