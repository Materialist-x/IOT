using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;

namespace V7Backend.WebSocket;

public class WsHub
{
    private readonly ConcurrentDictionary<Guid, System.Net.WebSockets.WebSocket> _clients = new();

    public async Task AddAndListenAsync(System.Net.WebSockets.WebSocket ws, CancellationToken cancellationToken)
    {
        var id = Guid.NewGuid();
        _clients[id] = ws;
        var buffer = new byte[1024];

        try
        {
            while (ws.State == WebSocketState.Open && !cancellationToken.IsCancellationRequested)
            {
                var result = await ws.ReceiveAsync(buffer, cancellationToken);
                if (result.MessageType == WebSocketMessageType.Close)
                {
                    break;
                }
            }
        }
        finally
        {
            _clients.TryRemove(id, out _);
            if (ws.State is WebSocketState.Open or WebSocketState.CloseReceived)
            {
                await ws.CloseAsync(WebSocketCloseStatus.NormalClosure, "closed", CancellationToken.None);
            }
        }
    }

    public async Task BroadcastAsync(object msg, CancellationToken cancellationToken = default)
    {
        var json = JsonSerializer.Serialize(msg);
        var buffer = Encoding.UTF8.GetBytes(json);

        foreach (var (id, client) in _clients)
        {
            if (client.State != WebSocketState.Open)
            {
                _clients.TryRemove(id, out _);
                continue;
            }

            await client.SendAsync(buffer, WebSocketMessageType.Text, true, cancellationToken);
        }
    }
}
