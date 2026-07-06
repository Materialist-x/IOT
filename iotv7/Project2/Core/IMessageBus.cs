using System.Threading;
using System.Threading.Tasks;
using Project2.Models;

namespace Project2.Core
{
    public interface IMessageBus
    {
        Task PublishAsync(IncomingTcpMessage message, CancellationToken cancellationToken);
    }
}
