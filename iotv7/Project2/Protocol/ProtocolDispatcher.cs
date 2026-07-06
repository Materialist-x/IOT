using System.Collections.Generic;
using Project2.Models;
using Project2.Protocol.Parsers;

namespace Project2.Protocol
{
    public sealed class ProtocolDispatcher
    {
        private readonly IReadOnlyList<IProtocolParser> _parsers;

        public ProtocolDispatcher()
        {
            _parsers = new IProtocolParser[]
            {
                new JsonParser(),
                new ModbusParser(),
                new DLT645Parser()
            };
        }

        public IReadOnlyList<TagValue> Dispatch(IncomingTcpMessage message)
        {
            foreach (var parser in _parsers)
            {
                if (parser.CanParse(message.Payload))
                {
                    return parser.Parse(message);
                }
            }

            return new List<TagValue>();
        }
    }
}
