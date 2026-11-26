import { Op } from 'sequelize';
import { Booking, BookingStatus, MeetingRoom, User, FoodOrder, BookingEquipment } from '../models';

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
        { 
          model: MeetingRoom, 
          as: 'Room', 
          attributes: ['id', 'room_name', 'location', 'capacity'], 
          where: Object.keys(roomWhere).length > 0 ? roomWhere : undefined 
        },
        { model: BookingStatus, as: 'Status' },
        { 
          model: User, 
          as: 'User', 
          attributes: ['first_name', 'last_name', 'email', 'department_name', 'department_code'] 
        },
        { model: FoodOrder, as: 'FoodOrder', attributes: ['id', 'food_status'] },
        { model: BookingEquipment, as: 'BookingEquipments', attributes: ['id'] },
      ],
      order: [['booking_date', 'ASC'], ['start_time', 'ASC']],
    });

    // Transform to calendar events format
    return bookings.map((b: any) => ({
      id: b.id,
      title: `${b.booking_name} - ${b.Room?.room_name || 'Unknown'}`,
      booking_name: b.booking_name,
      booking_date: b.booking_date,
      start_time: b.start_time,
      end_time: b.end_time,
      start: `${b.booking_date}T${b.start_time}`,
      end: `${b.booking_date}T${b.end_time}`,
      color: b.Status?.color || '#4F46E5',
      extendedProps: {
        booking_no: b.booking_no,
        room_id: b.room_id,
        room_name: b.Room?.room_name,
        location: b.Room?.location,
        status: b.Status?.status_code,
        status_name: b.Status?.status_name,
        participant_count: b.participant_count,
        organizer: b.User ? `${b.User.first_name} ${b.User.last_name}` : (b.contact_name || 'Guest'),
        department: b.User?.department_name || b.company_name || '-',
        has_food: !!b.FoodOrder,
        has_equipment: b.BookingEquipments && b.BookingEquipments.length > 0,
      },
    }));
  }
}
