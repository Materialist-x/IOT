using System.Collections.Generic;
using Project2.Models;
using Project2.Protocol;

namespace Project2.Core
{
    public sealed class ProtocolEngine
    {
        private readonly ProtocolDispatcher _dispatcher = new ProtocolDispatcher();

        public IReadOnlyList<TagValue> Decode(IncomingTcpMessage message)
        {
            return _dispatcher.Dispatch(message);
        }
    }
}
