using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Project2.Logging;
using Project2.Models;

namespace Project2.Core
{
    public sealed class BatchWriter
    {
        private readonly ConcurrentQueue<TagValue> _buffer = new ConcurrentQueue<TagValue>();
        private readonly IBulkTagValueRepository _repository;
        private readonly ILogger _logger;
        private readonly TimeSpan _flushInterval;

        public BatchWriter(IBulkTagValueRepository repository, ILogger logger, TimeSpan flushInterval)
        {
            _repository = repository;
            _logger = logger;
            _flushInterval = flushInterval;
        }

        public void Buffer(TagValue value)
        {
            _buffer.Enqueue(value);
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            return Task.Run(() => FlushLoop(cancellationToken), cancellationToken);
        }

        public async Task FlushOnceAsync(CancellationToken cancellationToken)
        {
            var batch = new List<TagValue>();
            TagValue value;
            while (_buffer.TryDequeue(out value))
            {
                batch.Add(value);
            }

            if (batch.Count == 0)
            {
                return;
            }

            await _repository.BulkInsertAsync(batch, cancellationToken).ConfigureAwait(false);
        }

        private async Task FlushLoop(CancellationToken cancellationToken)
        {
            while (!cancellationToken.IsCancellationRequested)
            {
                try
                {
                    await Task.Delay(_flushInterval, cancellationToken).ConfigureAwait(false);
                    await FlushOnceAsync(cancellationToken).ConfigureAwait(false);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.Error("Batch flush failed.", ex);
                }
            }

            try
            {
                await FlushOnceAsync(CancellationToken.None).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                _logger.Error("Final batch flush failed.", ex);
            }
        }
    }
}
