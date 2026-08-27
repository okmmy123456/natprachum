import { Op, fn, col, literal } from 'sequelize';
import { Booking, BookingStatus, MeetingRoom, User, Department } from '../models';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

export class ReportService {
  static async getBookingReport(type: string, query: any) {
    const now = new Date();
    let dateFrom: string;
    let dateTo: string;

    switch (type) {
      case 'daily':
        dateFrom = query.date || now.toISOString().slice(0, 10);
        dateTo = dateFrom;
        break;
      case 'monthly':
        const month = query.month || now.toISOString().slice(0, 7);
        dateFrom = `${month}-01`;
        const endMonth = new Date(`${month}-01`);
        endMonth.setMonth(endMonth.getMonth() + 1);
        endMonth.setDate(0);
        dateTo = endMonth.toISOString().slice(0, 10);
        break;
      case 'yearly':
        const year = query.year || now.getFullYear();
        dateFrom = `${year}-01-01`;
        dateTo = `${year}-12-31`;
        break;
      default:
        dateFrom = query.date_from || new Date(now.setMonth(now.getMonth() - 1)).toISOString().slice(0, 10);
        dateTo = query.date_to || new Date().toISOString().slice(0, 10);
    }

    const bookings = await Booking.findAll({
      where: { booking_date: { [Op.between]: [dateFrom, dateTo] } },
      include: [
        { model: MeetingRoom, as: 'Room', attributes: ['room_name', 'location'] },
        { model: User, as: 'User', attributes: ['first_name', 'last_name', 'email'] },
        { model: BookingStatus, as: 'Status', attributes: ['status_name', 'status_code'] },
      ],
      order: [['booking_date', 'ASC'], ['start_time', 'ASC']],
    });

    const summary = {
      total: bookings.length,
      by_status: {} as Record<string, number>,
      period: { from: dateFrom, to: dateTo },
    };

    bookings.forEach(b => {
      const status = b.Status?.status_name || 'Unknown';
      summary.by_status[status] = (summary.by_status[status] || 0) + 1;
    });

    return { bookings, summary };
  }

  static async getRoomUsageReport(query: any): Promise<any> {
    const dateFrom = query.date_from || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 10);
    const dateTo = query.date_to || new Date().toISOString().slice(0, 10);

    const approvedStatus = await BookingStatus.findOne({ where: { status_code: 'approved' } });
    const completedStatus = await BookingStatus.findOne({ where: { status_code: 'completed' } });
    const statusIds = [approvedStatus?.id, completedStatus?.id].filter(Boolean) as number[];

    const rooms = await MeetingRoom.findAll({
      where: { is_active: true },
      attributes: ['id', 'room_name', 'location', 'capacity'],
      raw: true,
    });

    const usage = [];
    for (const room of rooms) {
      const bookingCount = await Booking.count({
        where: {
          room_id: room.id,
          booking_date: { [Op.between]: [dateFrom, dateTo] },
          status_id: { [Op.in]: statusIds },
        },
      });
      usage.push({ ...room, booking_count: bookingCount });
    }

    return { usage, period: { from: dateFrom, to: dateTo } };
  }

  static async exportExcel(data: any[], columns: { header: string; key: string; width: number }[]) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Report');

    sheet.columns = columns;

    // Header styling
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F46E5' } };

    data.forEach(row => sheet.addRow(row));

    return workbook;
  }

  static async exportPDF(title: string, data: any[], columns: string[]) {
    const doc = new PDFDocument({ margin: 50 });

    // Title
    doc.fontSize(20).text(title, { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);

    // Table headers
    doc.fontSize(10).font('Helvetica-Bold');
    const colWidth = (doc.page.width - 100) / columns.length;
    let x = 50;
    columns.forEach(col => {
      doc.text(col, x, doc.y, { width: colWidth, continued: false });
      x += colWidth;
    });
    doc.moveDown();

    // Data rows
    doc.font('Helvetica').fontSize(9);
    data.forEach(row => {
      x = 50;
      columns.forEach(col => {
        doc.text(String(row[col] || ''), x, doc.y, { width: colWidth, continued: false });
        x += colWidth;
      });
      doc.moveDown(0.5);
    });

    return doc;
  }
}
