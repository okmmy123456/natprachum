import cron from 'node-cron';
import { Op } from 'sequelize';
import ActivityLog from '../models/ActivityLog';
import AuditLog from '../models/AuditLog';
import EmailLog from '../models/EmailLog';
import Notification from '../models/Notification';

export const setupCronJobs = () => {
  // Run every day at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('[CRON] Running log cleanup job...');
    
    // Calculate the date 180 days ago
    const retentionDays = 180;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    try {
      // 1. Clean ActivityLog
      const activityDeleted = await ActivityLog.destroy({
        where: { created_at: { [Op.lt]: cutoffDate } }
      });
      console.log(`[CRON] Deleted ${activityDeleted} old ActivityLog records.`);

      // 2. Clean AuditLog
      const auditDeleted = await AuditLog.destroy({
        where: { created_at: { [Op.lt]: cutoffDate } }
      });
      console.log(`[CRON] Deleted ${auditDeleted} old AuditLog records.`);

      // 3. Clean EmailLog
      const emailDeleted = await EmailLog.destroy({
        where: { created_at: { [Op.lt]: cutoffDate } }
      });
      console.log(`[CRON] Deleted ${emailDeleted} old EmailLog records.`);

      // 4. Clean Notifications (optional, usually you want to clean old notifications too)
      const notifDeleted = await Notification.destroy({
        where: { created_at: { [Op.lt]: cutoffDate } }
      });
      console.log(`[CRON] Deleted ${notifDeleted} old Notification records.`);

      console.log('[CRON] Log cleanup job completed successfully.');
    } catch (error) {
      console.error('[CRON] Error during log cleanup job:', error);
    }
  });

  console.log('[CRON] Cron jobs initialized.');
};
