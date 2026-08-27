import { Op, fn, col, literal } from 'sequelize';
import { Booking, BookingStatus, MeetingRoom, User, Department, FoodOrder } from '../models';

export class DashboardService {
  static async getStats() {
    const totalUsers = await User.count({ where: { is_active: true } });
    const totalRooms = await MeetingRoom.count({ where: { is_active: true } });
    const totalBookings = await Booking.count();

    const today = new Date().toISOString().slice(0, 10);
    const todaysBookings = await Booking.count({ where: { booking_date: today } });

    const pendingStatus = await BookingStatus.findOne({ where: { status_code: 'pending' } });
    const pendingApprovals = pendingStatus ? await Booking.count({ where: { status_id: pendingStatus.id } }) : 0;
    
    // Total food bookings overall
    const totalFoodBookings = await FoodOrder.count();

    return { totalUsers, totalRooms, totalBookings, todaysBookings, pendingApprovals, totalFoodBookings };
  }

  static async getAnalytics(query: any) {
    const dateFrom = query.date_from || new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().slice(0, 10);
    const dateTo = query.date_to || new Date().toISOString().slice(0, 10);

    // Most used rooms
    const mostUsedRooms = await Booking.findAll({
      where: { booking_date: { [Op.between]: [dateFrom, dateTo] } },
      attributes: ['room_id', [fn('COUNT', col('Booking.id')), 'booking_count']],
      include: [{ model: MeetingRoom, as: 'Room', attributes: ['room_name'] }],
      group: ['room_id', 'Room.id', 'Room.room_name'],
      order: [[literal('booking_count'), 'DESC']],
      limit: 10,
      raw: false,
    });

    // Monthly booking trends
    const bookingTrends = await Booking.findAll({
      where: { booking_date: { [Op.between]: [dateFrom, dateTo] } },
      attributes: [
        [fn('DATE_FORMAT', col('booking_date'), '%Y-%m'), 'month'],
        [fn('COUNT', col('Booking.id')), 'count'],
      ],
      group: [fn('DATE_FORMAT', col('booking_date'), '%Y-%m')],
      order: [[literal('month'), 'ASC']],
      raw: true,
    });

    // Department usage
    const departmentUsageRaw = await Booking.findAll({
      where: { booking_date: { [Op.between]: [dateFrom, dateTo] } },
      attributes: ['is_guest_booking', [fn('COUNT', col('Booking.id')), 'booking_count']],
      include: [{
        model: User, as: 'User', attributes: ['department_name']
      }],
      group: ['is_guest_booking', 'User.department_name'],
      order: [[literal('booking_count'), 'DESC']],
      limit: 10,
      raw: true,
    });

    const departmentUsage = departmentUsageRaw.map((d: any) => ({
      booking_count: d.booking_count,
      User: { Department: { department_name: d.is_guest_booking ? 'Guest (บุคคลภายนอก)' : (d['User.department_name'] || 'Unknown (ไม่มีแผนก)') } }
    }));

    // Customer Company Visits Ranking
    const customerCompanyVisits = await FoodOrder.findAll({
      attributes: ['customer_company', [fn('COUNT', col('FoodOrder.id')), 'visit_count']],
      include: [{
        model: Booking,
        as: 'Booking',
        where: { booking_date: { [Op.between]: [dateFrom, dateTo] } },
        attributes: []
      }],
      where: {
        customer_company: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] } as any
      },
      group: ['customer_company'],
      order: [[literal('visit_count'), 'DESC']],
      limit: 10,
      raw: true,
    });

    // Popular Menus
    const foodOrders = await FoodOrder.findAll({
      attributes: ['breakfast_items', 'lunch_items', 'afternoon_items'],
      include: [{
        model: Booking,
        as: 'Booking',
        where: { booking_date: { [Op.between]: [dateFrom, dateTo] } },
        attributes: []
      }],
      raw: true,
    });

    const menuCounts: Record<string, number> = {};
    const safeParse = (str: any) => {
      if (!str) return [];
      try { const parsed = JSON.parse(str); return Array.isArray(parsed) ? parsed : []; } 
      catch { return []; }
    };
    
    foodOrders.forEach((order: any) => {
      const items = [
        ...safeParse(order.breakfast_items),
        ...safeParse(order.lunch_items),
        ...safeParse(order.afternoon_items)
      ];
      
      items.forEach(item => {
        if (item && typeof item === 'string' && item.trim()) {
          const name = item.trim();
          menuCounts[name] = (menuCounts[name] || 0) + 1;
        }
      });
    });

    const popularMenus = Object.entries(menuCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return { mostUsedRooms, bookingTrends, departmentUsage, customerCompanyVisits, popularMenus };
  }
}
