import { Notification } from '../models';

export const createNotification = async (
  userId: number,
  title: string,
  message: string,
  type: string = 'info',
  referenceId?: number,
  referenceType?: string
): Promise<void> => {
  try {
    await Notification.create({
      user_id: userId,
      title,
      message,
      type,
      reference_id: referenceId,
      reference_type: referenceType,
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

export const getUnreadCount = async (userId: number): Promise<number> => {
  return Notification.count({
    where: { user_id: userId, is_read: false },
  });
};
