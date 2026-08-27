import { AuditLog } from '../models';

export const logAudit = async (
  tableName: string,
  recordId: number,
  actionType: 'CREATE' | 'UPDATE' | 'DELETE',
  oldData: object | null,
  newData: object | null,
  actionBy?: number
): Promise<void> => {
  try {
    await AuditLog.create({
      table_name: tableName,
      record_id: recordId,
      action_type: actionType,
      old_data: oldData || undefined,
      new_data: newData || undefined,
      action_by: actionBy,
    });
  } catch (error) {
    console.error('Failed to log audit:', error);
  }
};
