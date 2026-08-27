import { Permission, Role, RolePermission } from '../models';

const permissions = [
  // Dashboard
  { permission_name: 'View Dashboard', permission_code: 'dashboard.view', module: 'dashboard', type: 'menu' as const },
  // Users
  { permission_name: 'View Users', permission_code: 'users.view', module: 'users', type: 'menu' as const },
  { permission_name: 'Create User', permission_code: 'users.create', module: 'users', type: 'api' as const },
  { permission_name: 'Edit User', permission_code: 'users.edit', module: 'users', type: 'api' as const },
  { permission_name: 'Delete User', permission_code: 'users.delete', module: 'users', type: 'api' as const },
  // Roles
  { permission_name: 'View Roles', permission_code: 'roles.view', module: 'roles', type: 'menu' as const },
  { permission_name: 'Manage Roles', permission_code: 'roles.manage', module: 'roles', type: 'api' as const },
  // Rooms
  { permission_name: 'View Rooms', permission_code: 'rooms.view', module: 'rooms', type: 'menu' as const },
  { permission_name: 'Create Room', permission_code: 'rooms.create', module: 'rooms', type: 'api' as const },
  { permission_name: 'Edit Room', permission_code: 'rooms.edit', module: 'rooms', type: 'api' as const },
  { permission_name: 'Delete Room', permission_code: 'rooms.delete', module: 'rooms', type: 'api' as const },
  // Bookings
  { permission_name: 'View Bookings', permission_code: 'bookings.view', module: 'bookings', type: 'menu' as const },
  { permission_name: 'Create Booking', permission_code: 'bookings.create', module: 'bookings', type: 'api' as const },
  { permission_name: 'Edit Booking', permission_code: 'bookings.edit', module: 'bookings', type: 'api' as const },
  { permission_name: 'Cancel Booking', permission_code: 'bookings.cancel', module: 'bookings', type: 'api' as const },
  // Approvals
  { permission_name: 'View Approvals', permission_code: 'approvals.view', module: 'approvals', type: 'menu' as const },
  { permission_name: 'Approve Booking', permission_code: 'approvals.approve', module: 'approvals', type: 'api' as const },
  { permission_name: 'Reject Booking', permission_code: 'approvals.reject', module: 'approvals', type: 'api' as const },
  // Calendar
  { permission_name: 'View Calendar', permission_code: 'calendar.view', module: 'calendar', type: 'menu' as const },
  // Reports
  { permission_name: 'View Reports', permission_code: 'reports.view', module: 'reports', type: 'menu' as const },
  { permission_name: 'Export Reports', permission_code: 'reports.export', module: 'reports', type: 'api' as const },
  // Master Data
  { permission_name: 'View Master Data', permission_code: 'masterdata.view', module: 'masterdata', type: 'menu' as const },
  { permission_name: 'Manage Master Data', permission_code: 'masterdata.manage', module: 'masterdata', type: 'api' as const },
  // Holidays
  { permission_name: 'View Holidays', permission_code: 'holidays.view', module: 'holidays', type: 'menu' as const },
  { permission_name: 'Manage Holidays', permission_code: 'holidays.manage', module: 'holidays', type: 'api' as const },
  // Settings
  { permission_name: 'View Settings', permission_code: 'settings.view', module: 'settings', type: 'menu' as const },
  { permission_name: 'Manage Settings', permission_code: 'settings.manage', module: 'settings', type: 'api' as const },
  // Notifications
  { permission_name: 'View Notifications', permission_code: 'notifications.view', module: 'notifications', type: 'menu' as const },
  // Activity Logs
  { permission_name: 'View Activity Logs', permission_code: 'activitylogs.view', module: 'logs', type: 'menu' as const },
  // Audit Logs
  { permission_name: 'View Audit Logs', permission_code: 'auditlogs.view', module: 'logs', type: 'menu' as const },
  // Food Orders
  { permission_name: 'View Food Orders', permission_code: 'food_orders.view', module: 'food_orders', type: 'menu' as const },
  { permission_name: 'Create Food Order', permission_code: 'food_orders.create', module: 'food_orders', type: 'api' as const },
  { permission_name: 'Approve Food Order', permission_code: 'food_orders.approve', module: 'food_orders', type: 'api' as const },
];

// Role-permission mappings
const rolePermissions: Record<string, string[]> = {
  SuperAdmin: permissions.map(p => p.permission_code), // All permissions
  Admin: [
    'dashboard.view', 'users.view', 'users.create', 'users.edit',
    'rooms.view', 'rooms.create', 'rooms.edit', 'rooms.delete',
    'bookings.view', 'bookings.create', 'bookings.edit', 'bookings.cancel',
    'approvals.view', 'approvals.approve', 'approvals.reject',
    'calendar.view', 'reports.view', 'reports.export',
    'masterdata.view', 'masterdata.manage',
    'holidays.view', 'holidays.manage',
    'notifications.view', 'activitylogs.view',
    'food_orders.view', 'food_orders.create', 'food_orders.approve',
  ],
  Manager: [
    'dashboard.view', 'rooms.view',
    'bookings.view', 'bookings.create', 'bookings.edit', 'bookings.cancel',
    'approvals.view', 'approvals.approve', 'approvals.reject',
    'calendar.view', 'notifications.view',
    'food_orders.view', 'food_orders.create', 'food_orders.approve',
  ],
  RoomOwner: [
    'dashboard.view', 'rooms.view', 'rooms.edit',
    'bookings.view', 'bookings.create', 'bookings.edit', 'bookings.cancel',
    'approvals.view', 'approvals.approve', 'approvals.reject',
    'calendar.view', 'notifications.view',
  ],
  NormalUser: [
    'dashboard.view', 'rooms.view',
    'bookings.view', 'bookings.create', 'bookings.cancel',
    'calendar.view', 'notifications.view',
    'food_orders.view', 'food_orders.create',
  ],
  Guest: [
    'rooms.view', 'bookings.create',
  ],
};

export const seedPermissions = async () => {
  // Create permissions
  for (const perm of permissions) {
    await Permission.findOrCreate({
      where: { permission_code: perm.permission_code },
      defaults: perm,
    });
  }

  // Assign permissions to roles
  for (const [roleCode, permCodes] of Object.entries(rolePermissions)) {
    const role = await Role.findOne({ where: { role_code: roleCode } });
    if (!role) continue;

    for (const permCode of permCodes) {
      const permission = await Permission.findOne({ where: { permission_code: permCode } });
      if (!permission) continue;

      try {
        await RolePermission.findOrCreate({
          where: { role_id: role.id, permission_id: permission.id },
          defaults: { role_id: role.id, permission_id: permission.id } as any,
        });
      } catch (err) {
        // Ignore duplicate entry errors
      }
    }
  }

  console.log('  🔐 Permissions seeded');
};
