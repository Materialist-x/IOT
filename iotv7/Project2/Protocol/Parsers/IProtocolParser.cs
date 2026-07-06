using System.Collections.Generic;
using Project2.Models;

namespace Project2.Protocol.Parsers
{
    public interface IProtocolParser
    {
        bool CanParse(byte[] payload);

        IReadOnlyList<TagValue> Parse(IncomingTcpMessage message);
    }
}
