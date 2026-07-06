namespace V7Backend.Services;

public class ProtocolHandlerRegistry
{
    private readonly Dictionary<string, IProtocolHandler> _handlers;

    public ProtocolHandlerRegistry(IEnumerable<IProtocolHandler> handlers)
    {
        _handlers = handlers.ToDictionary(handler => handler.ProtocolKey, StringComparer.OrdinalIgnoreCase);
    }

    public IProtocolHandler Get(string protocol)
    {
        var key = NormalizeProtocol(protocol);
        if (_handlers.TryGetValue(key, out var handler))
        {
            return handler;
        }

        throw new InvalidOperationException($"Unknown protocol: {protocol}");
    }

    private static string NormalizeProtocol(string protocol)
    {
        return protocol.Replace(" ", string.Empty, StringComparison.OrdinalIgnoreCase).ToLowerInvariant();
    }
}
