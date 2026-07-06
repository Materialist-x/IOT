using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Project2.Models;

namespace Project2.Core
{
    public interface IBulkTagValueRepository
    {
        Task BulkInsertAsync(IReadOnlyList<TagValue> values, CancellationToken cancellationToken);
    }
}
