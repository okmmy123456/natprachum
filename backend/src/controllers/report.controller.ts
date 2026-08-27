import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { ReportService } from '../services/report.service';
import { sendSuccess, sendError } from '../utils/response';

export class ReportController {
  static async getReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { type } = req.params;
      if (!['daily', 'monthly', 'yearly', 'room_usage', 'department'].includes(type)) {
        return sendError(res, 'Invalid report type', 400);
      }

      if (type === 'room_usage') {
        const result = await ReportService.getRoomUsageReport(req.query);
        return sendSuccess(res, result);
      }

      const result = await ReportService.getBookingReport(type, req.query);
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }

  static async exportReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { type } = req.params;
      const format = req.query.format as string || 'excel';
      const reportData = await ReportService.getBookingReport(type, req.query);

      if (format === 'excel') {
        const columns = [
          { header: 'Booking No', key: 'booking_no', width: 20 },
          { header: 'Name', key: 'booking_name', width: 30 },
          { header: 'Room', key: 'room_name', width: 20 },
          { header: 'Date', key: 'booking_date', width: 15 },
          { header: 'Start', key: 'start_time', width: 10 },
          { header: 'End', key: 'end_time', width: 10 },
          { header: 'Status', key: 'status', width: 15 },
        ];

        const data = reportData.bookings.map((b: any) => ({
          booking_no: b.booking_no,
          booking_name: b.booking_name,
          room_name: b.Room?.room_name || '',
          booking_date: b.booking_date,
          start_time: b.start_time,
          end_time: b.end_time,
          status: b.Status?.status_name || '',
        }));

        const workbook = await ReportService.exportExcel(data, columns);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=report_${type}_${Date.now()}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();
      } else if (format === 'pdf') {
        const data = reportData.bookings.map((b: any) => ({
          booking_no: b.booking_no,
          booking_name: b.booking_name,
          room_name: b.Room?.room_name || '',
          booking_date: b.booking_date,
          start_time: b.start_time,
          end_time: b.end_time,
          status: b.Status?.status_name || '',
        }));

        const doc = await ReportService.exportPDF(`Booking Report - ${type}`, data, ['booking_no', 'booking_name', 'room_name', 'booking_date', 'status']);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=report_${type}_${Date.now()}.pdf`);
        doc.pipe(res);
        doc.end();
      } else {
        sendError(res, 'Invalid format. Use excel or pdf', 400);
      }
    } catch (error) { next(error); }
  }
}
