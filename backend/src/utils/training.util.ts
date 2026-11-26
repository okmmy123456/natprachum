export interface SyncTrainingMeetingPayload {
  natprachum_booking_id: number;
  booking_no: string;
  booking_name: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  room_name?: string;
  location?: string;
  organizer?: string;
  participant_count?: number;
  purpose?: string;
  status?: 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';
}

export const syncBookingToTrainingSystem = async (payload: SyncTrainingMeetingPayload): Promise<boolean> => {
  try {
    const url = process.env.TRAINING_SYSTEM_API_URL || 'http://localhost:5005/api/meetings/sync-from-natprachum';
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log(`Successfully synced booking ${payload.booking_no} to Training System.`);
      return true;
    } else {
      const errText = await response.text();
      console.error(`Failed to sync booking ${payload.booking_no} to Training System. Status: ${response.status} - ${errText}`);
      return false;
    }
  } catch (err) {
    console.error(`Error syncing booking ${payload.booking_no} to Training System:`, err);
    return false;
  }
};
