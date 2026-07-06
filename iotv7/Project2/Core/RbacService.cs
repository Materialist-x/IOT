using System.Collections.Concurrent;
using System.Collections.Generic;
using Project2.Models;

namespace Project2.Core
{
    public sealed class RbacService
    {
        private readonly ConcurrentDictionary<Role, HashSet<Permission>> _permissions =
            new ConcurrentDictionary<Role, HashSet<Permission>>();

        public RbacService()
        {
            _permissions[Role.SuperAdmin] = new HashSet<Permission>
            {
                Permission.ManageAllTenants,
                Permission.ManageBilling,
                Permission.ConfigureSystem
            };
            _permissions[Role.TenantAdmin] = new HashSet<Permission>
            {
                Permission.CreateDevices,
                Permission.ManageLicenses,
                Permission.ManageUsers
            };
            _permissions[Role.Engineer] = new HashSet<Permission>
            {
                Permission.ConfigureScada,
                Permission.ConfigureTags,
                Permission.ConfigureProtocols
            };
            _permissions[Role.Operator] = new HashSet<Permission>
            {
                Permission.MonitorDevices,
                Permission.AcknowledgeAlarms,
                Permission.SendCommands
            };
            _permissions[Role.Viewer] = new HashSet<Permission>
            {
                Permission.ReadDashboard
            };
        }

        public bool HasPermission(Role role, Permission permission)
        {
            HashSet<Permission> permissions;
            return _permissions.TryGetValue(role, out permissions) && permissions.Contains(permission);
        }
    }
}
