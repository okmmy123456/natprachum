import bcrypt from 'bcrypt';
import { User, Role, Company, Department, SystemConfig } from '../models';

export const seedSuperAdmin = async () => {
  const superAdminRole = await Role.findOne({ where: { role_code: 'SuperAdmin' } });
  if (!superAdminRole) return;

  // Create default company
  const [company] = await Company.findOrCreate({
    where: { company_code: 'DEFAULT' },
    defaults: { company_name: 'Default Company', company_code: 'DEFAULT' },
  });

  // Create default department
  const [department] = await Department.findOrCreate({
    where: { department_code: 'IT' },
    defaults: { department_name: 'Information Technology', department_code: 'IT', company_id: company.id },
  });

  // Create super admin user
  const existingAdmin = await User.findOne({ where: { username: 'admin' } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('Admin@123456', 12);
    await User.create({
      username: 'admin',
      password_hash: passwordHash,
      first_name: 'Super',
      last_name: 'Admin',
      email: 'admin@natprachum.com',
      email_verified: true,
      role_id: superAdminRole.id,
      company_id: company.id,
      department_id: department.id,
      department_code: 'IT',
      department_name: 'Information Technology',
      is_active: true,
    });
    console.log('  👤 SuperAdmin created (admin / Admin@123456)');
  }

  // Seed default system configs
  const defaultConfigs = [
    { config_key: 'max_booking_days', config_value: '30', config_type: 'number' as const, description: 'Maximum days in advance for booking' },
    { config_key: 'max_booking_hours', config_value: '8', config_type: 'number' as const, description: 'Maximum booking duration in hours' },
    { config_key: 'min_booking_minutes', config_value: '30', config_type: 'number' as const, description: 'Minimum booking duration in minutes' },
    { config_key: 'reminder_before_meeting', config_value: '15', config_type: 'number' as const, description: 'Minutes before meeting to send reminder' },
    { config_key: 'smtp_host', config_value: process.env.SMTP_HOST || 'smtp.gmail.com', config_type: 'string' as const, description: 'SMTP server host' },
    { config_key: 'smtp_port', config_value: process.env.SMTP_PORT || '587', config_type: 'number' as const, description: 'SMTP server port' },
    { config_key: 'smtp_user', config_value: process.env.SMTP_USER || '', config_type: 'string' as const, description: 'SMTP username' },
    { config_key: 'smtp_password', config_value: process.env.SMTP_PASSWORD || '', config_type: 'string' as const, description: 'SMTP password' },
  ];

  for (const config of defaultConfigs) {
    await SystemConfig.findOrCreate({
      where: { config_key: config.config_key },
      defaults: config,
    });
  }
  console.log('  ⚙️  System configs seeded');
};
