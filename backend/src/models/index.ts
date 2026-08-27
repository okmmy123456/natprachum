import sequelize from '../config/database';

// Import all models
import Company from './Company';
import Site from './Site';
import Department from './Department';
import Role from './Role';
import Permission from './Permission';
import RolePermission from './RolePermission';
import User from './User';
import RefreshToken from './RefreshToken';
import OtpVerification from './OtpVerification';
import MeetingRoom from './MeetingRoom';
import RoomOwner from './RoomOwner';
import RoomImage from './RoomImage';
import Equipment from './Equipment';
import RoomEquipment from './RoomEquipment';
import BookingStatus from './BookingStatus';
import Booking from './Booking';
import BookingParticipant from './BookingParticipant';
import BookingEquipment from './BookingEquipment';
import Notification from './Notification';
import EmailLog from './EmailLog';
import ActivityLog from './ActivityLog';
import AuditLog from './AuditLog';
import CompanyHoliday from './CompanyHoliday';
import SystemConfig from './SystemConfig';
import FoodOrder from './FoodOrder';
import FoodOrderDiner from './FoodOrderDiner';

// ==========================================
// ASSOCIATIONS
// ==========================================

// Company ↔ Site
Company.hasMany(Site, { foreignKey: 'company_id', as: 'Sites' });
Site.belongsTo(Company, { foreignKey: 'company_id', as: 'Company' });

// Company ↔ Department
Company.hasMany(Department, { foreignKey: 'company_id', as: 'Departments' });
Department.belongsTo(Company, { foreignKey: 'company_id', as: 'Company' });

// Company ↔ CompanyHoliday
Company.hasMany(CompanyHoliday, { foreignKey: 'company_id', as: 'Holidays' });
CompanyHoliday.belongsTo(Company, { foreignKey: 'company_id', as: 'Company' });

// Role ↔ Permission (Many-to-Many through RolePermission)
Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'role_id', otherKey: 'permission_id', as: 'Permissions' });
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permission_id', otherKey: 'role_id', as: 'Roles' });
Role.hasMany(RolePermission, { foreignKey: 'role_id', as: 'RolePermissions' });
RolePermission.belongsTo(Role, { foreignKey: 'role_id', as: 'Role' });
RolePermission.belongsTo(Permission, { foreignKey: 'permission_id', as: 'Permission' });

// User ↔ Role
Role.hasMany(User, { foreignKey: 'role_id', as: 'Users' });
User.belongsTo(Role, { foreignKey: 'role_id', as: 'Role' });

// User ↔ Company
Company.hasMany(User, { foreignKey: 'company_id', as: 'Users' });
User.belongsTo(Company, { foreignKey: 'company_id', as: 'Company' });

// User ↔ Site
Site.hasMany(User, { foreignKey: 'site_id', as: 'Users' });
User.belongsTo(Site, { foreignKey: 'site_id', as: 'Site' });

// User ↔ Department
Department.hasMany(User, { foreignKey: 'department_id', as: 'Users' });
User.belongsTo(Department, { foreignKey: 'department_id', as: 'Department' });

// User ↔ RefreshToken
User.hasMany(RefreshToken, { foreignKey: 'user_id', as: 'RefreshTokens' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id', as: 'User' });

// User ↔ OtpVerification
User.hasMany(OtpVerification, { foreignKey: 'user_id', as: 'OtpVerifications' });
OtpVerification.belongsTo(User, { foreignKey: 'user_id', as: 'User' });

// MeetingRoom ↔ User (Owners)
MeetingRoom.belongsToMany(User, { through: RoomOwner, foreignKey: 'room_id', otherKey: 'user_id', as: 'Owners' });
User.belongsToMany(MeetingRoom, { through: RoomOwner, foreignKey: 'user_id', otherKey: 'room_id', as: 'ManagedRooms' });
RoomOwner.belongsTo(MeetingRoom, { foreignKey: 'room_id', as: 'Room' });
RoomOwner.belongsTo(User, { foreignKey: 'user_id', as: 'User' });
MeetingRoom.hasMany(RoomOwner, { foreignKey: 'room_id', as: 'RoomOwners' });
User.hasMany(RoomOwner, { foreignKey: 'user_id', as: 'RoomOwners' });

// MeetingRoom ↔ RoomImage
MeetingRoom.hasMany(RoomImage, { foreignKey: 'room_id', as: 'RoomImages' });
RoomImage.belongsTo(MeetingRoom, { foreignKey: 'room_id', as: 'Room' });

// MeetingRoom ↔ Equipment (Many-to-Many through RoomEquipment)
MeetingRoom.belongsToMany(Equipment, { through: RoomEquipment, foreignKey: 'room_id', otherKey: 'equipment_id', as: 'Equipments' });
Equipment.belongsToMany(MeetingRoom, { through: RoomEquipment, foreignKey: 'equipment_id', otherKey: 'room_id', as: 'Rooms' });
MeetingRoom.hasMany(RoomEquipment, { foreignKey: 'room_id', as: 'RoomEquipments' });
RoomEquipment.belongsTo(MeetingRoom, { foreignKey: 'room_id', as: 'Room' });
RoomEquipment.belongsTo(Equipment, { foreignKey: 'equipment_id', as: 'Equipment' });

// Booking ↔ MeetingRoom
MeetingRoom.hasMany(Booking, { foreignKey: 'room_id', as: 'Bookings' });
Booking.belongsTo(MeetingRoom, { foreignKey: 'room_id', as: 'Room' });

// Booking ↔ User (Creator)
User.hasMany(Booking, { foreignKey: 'user_id', as: 'Bookings' });
Booking.belongsTo(User, { foreignKey: 'user_id', as: 'User' });

// Booking ↔ User (Approver)
Booking.belongsTo(User, { foreignKey: 'approved_by', as: 'Approver' });

// Booking ↔ BookingStatus
BookingStatus.hasMany(Booking, { foreignKey: 'status_id', as: 'Bookings' });
Booking.belongsTo(BookingStatus, { foreignKey: 'status_id', as: 'Status' });

// Booking ↔ BookingParticipant
Booking.hasMany(BookingParticipant, { foreignKey: 'booking_id', as: 'Participants' });
BookingParticipant.belongsTo(Booking, { foreignKey: 'booking_id', as: 'Booking' });

// Booking ↔ Equipment (Many-to-Many through BookingEquipment)
Booking.belongsToMany(Equipment, { through: BookingEquipment, foreignKey: 'booking_id', otherKey: 'equipment_id', as: 'Equipments' });
Equipment.belongsToMany(Booking, { through: BookingEquipment, foreignKey: 'equipment_id', otherKey: 'booking_id', as: 'Bookings' });
Booking.hasMany(BookingEquipment, { foreignKey: 'booking_id', as: 'BookingEquipments' });
BookingEquipment.belongsTo(Booking, { foreignKey: 'booking_id', as: 'Booking' });
BookingEquipment.belongsTo(Equipment, { foreignKey: 'equipment_id', as: 'Equipment' });

// User ↔ Notification
User.hasMany(Notification, { foreignKey: 'user_id', as: 'Notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'User' });

// User ↔ EmailLog
User.hasMany(EmailLog, { foreignKey: 'user_id', as: 'EmailLogs' });
EmailLog.belongsTo(User, { foreignKey: 'user_id', as: 'User' });

// User ↔ ActivityLog
User.hasMany(ActivityLog, { foreignKey: 'user_id', as: 'ActivityLogs' });
ActivityLog.belongsTo(User, { foreignKey: 'user_id', as: 'User' });

// User ↔ AuditLog
User.hasMany(AuditLog, { foreignKey: 'action_by', as: 'AuditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'action_by', as: 'User' });

// SystemConfig ↔ User
SystemConfig.belongsTo(User, { foreignKey: 'updated_by', as: 'UpdatedByUser' });

// FoodOrder ↔ Booking
Booking.hasOne(FoodOrder, { foreignKey: 'booking_id', as: 'FoodOrder' });
FoodOrder.belongsTo(Booking, { foreignKey: 'booking_id', as: 'Booking' });

// FoodOrder ↔ FoodOrderDiner
FoodOrder.hasMany(FoodOrderDiner, { foreignKey: 'food_order_id', as: 'Diners' });
FoodOrderDiner.belongsTo(FoodOrder, { foreignKey: 'food_order_id', as: 'FoodOrder' });

// FoodOrder ↔ User (Approver)
FoodOrder.belongsTo(User, { foreignKey: 'food_approved_by', as: 'FoodApprover' });

// Export all models
export {
  sequelize,
  Company,
  Site,
  Department,
  Role,
  Permission,
  RolePermission,
  User,
  RefreshToken,
  OtpVerification,
  MeetingRoom,
  RoomOwner,
  RoomImage,
  Equipment,
  RoomEquipment,
  BookingStatus,
  Booking,
  BookingParticipant,
  BookingEquipment,
  Notification,
  EmailLog,
  ActivityLog,
  AuditLog,
  CompanyHoliday,
  SystemConfig,
  FoodOrder,
  FoodOrderDiner,
};
