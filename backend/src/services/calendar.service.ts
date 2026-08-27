import { Op } from 'sequelize';
import { Booking, BookingStatus, MeetingRoom } from '../models';

export class CalendarService {
  static async getEvents(query: any) {
    const where: any = {};

    if (query.room_id) where.room_id = query.room_id;
    if (query.status_id) where.status_id = query.status_id;
    if (query.start && query.end) {
      where.booking_date = { [Op.between]: [query.start, query.end] };
    } else if (query.date) {
      where.booking_date = query.date;
    }

    // By default only show approved and pending
    if (!query.status_id) {
      const statuses = await BookingStatus.findAll({
        where: { status_code: { [Op.in]: ['approved', 'pending'] } },
      });
      where.status_id = { [Op.in]: statuses.map(s => s.id) };
    }

    const roomWhere: any = {};
    if (query.location) {
      roomWhere.location = query.location;
    }

    const bookings = await Booking.findAll({
      where,
      include: [
        { model: MeetingRoom, as: 'Room', attributes: ['id', 'room_name', 'location'], where: Object.keys(roomWhere).length > 0 ? roomWhere : undefined },
        { model: BookingStatus, as: 'Status' },
      ],
      order: [['booking_date', 'ASC'], ['start_time', 'ASC']],
    });

    // Transform to calendar events format
    return bookings.map(b => ({
      id: b.id,
      title: `${b.booking_name} - ${b.Room?.room_name || 'Unknown'}`,
      start: `${b.booking_date}T${b.start_time}`,
      end: `${b.booking_date}T${b.end_time}`,
      color: b.Status?.color || '#6B7280',
      extendedProps: {
        booking_no: b.booking_no,
        room_id: b.room_id,
        room_name: b.Room?.room_name,
        location: b.Room?.location,
        status: b.Status?.status_code,
        status_name: b.Status?.status_name,
        participant_count: b.participant_count,
      },
    }));
  }
}
