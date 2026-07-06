using System;
using System.Collections.Concurrent;
using System.Threading;
using System.Threading.Tasks;
using Project2.Logging;
using Project2.Models;

namespace Project2.Core
{
    public sealed class ChannelQueue : IChannelQueue
    {
        private sealed class DeviceQueue
        {
            public readonly ConcurrentQueue<IncomingTcpMessage> Messages = new ConcurrentQueue<IncomingTcpMessage>();

            public readonly SemaphoreSlim Signal = new SemaphoreSlim(0);

            public int Length;

            public int ConsumerStarted;

            public volatile bool Stopped;
        }

        private readonly ConcurrentDictionary<string, DeviceQueue> _queues =
            new ConcurrentDictionary<string, DeviceQueue>();

        private readonly ChannelQueueOptions _options;
        private readonly ILogger _logger;
        private Func<IncomingTcpMessage, CancellationToken, Task> _handler;
        private CancellationToken _cancellationToken;

        public ChannelQueue(ChannelQueueOptions options, ILogger logger)
        {
            _options = options;
            _logger = logger;
        }

        public bool Enqueue(IncomingTcpMessage message)
        {
            var queueKey = BuildKey(message.TenantId, message.DeviceId);
            var queue = _queues.GetOrAdd(queueKey, key => new DeviceQueue());
            if (queue.Stopped)
            {
                return false;
            }

            var length = Volatile.Read(ref queue.Length);
            if (length > _options.BackpressureThreshold && message.Kind == MessageKind.Heartbeat)
            {
                _logger.Warn("Backpressure: dropped heartbeat for tenant/device " + queueKey + ", queue length=" + length);
                return false;
            }

            queue.Messages.Enqueue(message);
            Interlocked.Increment(ref queue.Length);
            queue.Signal.Release();
            EnsureConsumer(queueKey, queue);
            return true;
        }

        public void StopDevice(string tenantId, string deviceId)
        {
            DeviceQueue queue;
            if (_queues.TryGetValue(BuildKey(tenantId, deviceId), out queue))
            {
                queue.Stopped = true;
                queue.Signal.Release();
            }
        }

        public void StopTenant(string tenantId)
        {
            foreach (var pair in _queues)
            {
                if (pair.Key.StartsWith(tenantId + "/", StringComparison.Ordinal))
                {
                    pair.Value.Stopped = true;
                    pair.Value.Signal.Release();
                }
            }
        }

        public void StartConsumer(Func<IncomingTcpMessage, CancellationToken, Task> handler, CancellationToken cancellationToken)
        {
            _handler = handler;
            _cancellationToken = cancellationToken;

            foreach (var pair in _queues)
            {
                EnsureConsumer(pair.Key, pair.Value);
            }
        }

        public int GetLength(string tenantId, string deviceId)
        {
            DeviceQueue queue;
            return _queues.TryGetValue(BuildKey(tenantId, deviceId), out queue) ? Volatile.Read(ref queue.Length) : 0;
        }

        private void EnsureConsumer(string deviceId, DeviceQueue queue)
        {
            if (_handler == null)
            {
                return;
            }

            if (Interlocked.CompareExchange(ref queue.ConsumerStarted, 1, 0) != 0)
            {
                return;
            }

            Task.Run(() => ConsumeDeviceQueue(deviceId, queue, _handler, _cancellationToken));
        }

        private async Task ConsumeDeviceQueue(
            string deviceId,
            DeviceQueue queue,
            Func<IncomingTcpMessage, CancellationToken, Task> handler,
            CancellationToken cancellationToken)
        {
            while (!cancellationToken.IsCancellationRequested && !queue.Stopped)
            {
                try
                {
                    await queue.Signal.WaitAsync(cancellationToken).ConfigureAwait(false);
                }
                catch (OperationCanceledException)
                {
                    break;
                }

                IncomingTcpMessage message;
                while (!queue.Stopped && queue.Messages.TryDequeue(out message))
                {
                    Interlocked.Decrement(ref queue.Length);
                    try
                    {
                        await handler(message, cancellationToken).ConfigureAwait(false);
                    }
                    catch (OperationCanceledException)
                    {
                        return;
                    }
                    catch (Exception ex)
                    {
                        _logger.Error("Message processing failed for tenant/device " + deviceId, ex);
                    }
                }
            }
        }

        private static string BuildKey(string tenantId, string deviceId)
        {
            return tenantId + "/" + deviceId;
        }
    }
}
