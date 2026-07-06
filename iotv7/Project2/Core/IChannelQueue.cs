using System;
using System.Threading;
using System.Threading.Tasks;
using Project2.Models;

namespace Project2.Core
{
    public interface IChannelQueue
    {
        bool Enqueue(IncomingTcpMessage message);

        void StopDevice(string tenantId, string deviceId);

        void StopTenant(string tenantId);

        void StartConsumer(Func<IncomingTcpMessage, CancellationToken, Task> handler, CancellationToken cancellationToken);

        int GetLength(string tenantId, string deviceId);
    }
}
