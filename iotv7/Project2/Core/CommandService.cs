using System;
using System.Collections.Concurrent;
using Project2.Models;

namespace Project2.Core
{
    public sealed class CommandService
    {
        private readonly ConcurrentDictionary<string, ScadaCommand> _commands =
            new ConcurrentDictionary<string, ScadaCommand>();

        public ScadaCommand Create(string tenantId, string deviceId, string payload)
        {
            var command = new ScadaCommand
            {
                CommandId = Guid.NewGuid().ToString("N"),
                TenantId = tenantId,
                DeviceId = deviceId,
                Payload = payload,
                Status = CommandStatus.Created,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _commands[command.CommandId] = command;
            return command;
        }

        public bool MoveNext(string tenantId, string commandId, CommandStatus status)
        {
            ScadaCommand command;
            if (!_commands.TryGetValue(commandId, out command) || command.TenantId != tenantId)
            {
                return false;
            }

            if (!IsValidTransition(command.Status, status))
            {
                return false;
            }

            command.Status = status;
            command.UpdatedAt = DateTime.UtcNow;
            return true;
        }

        private static bool IsValidTransition(CommandStatus current, CommandStatus next)
        {
            return (current == CommandStatus.Created && next == CommandStatus.Sent) ||
                   (current == CommandStatus.Sent && next == CommandStatus.Ack) ||
                   (current == CommandStatus.Ack && next == CommandStatus.Completed) ||
                   next == CommandStatus.Failed;
        }
    }
}
