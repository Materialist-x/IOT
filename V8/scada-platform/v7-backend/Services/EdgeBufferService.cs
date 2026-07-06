using System.Collections.Concurrent;

namespace V7Backend.Services;

public class EdgeBufferService
{
    private readonly ConcurrentQueue<EdgeBufferedPacket> _memoryQueue = new();

    public void Enqueue(string kind, object payload)
    {
        _memoryQueue.Enqueue(new EdgeBufferedPacket(kind, payload, DateTimeOffset.UtcNow));
    }

    public IReadOnlyList<EdgeBufferedPacket> Snapshot(int max = 200)
    {
        return _memoryQueue.Take(max).ToArray();
    }

    public bool TryDequeue(out EdgeBufferedPacket? packet)
    {
        if (_memoryQueue.TryDequeue(out var value))
        {
            packet = value;
            return true;
        }

        packet = null;
        return false;
    }
}

public record EdgeBufferedPacket(string Kind, object Payload, DateTimeOffset BufferedAt);
