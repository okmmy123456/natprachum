import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import FoodOrder from '../models/FoodOrder';
import Booking from '../models/Booking';
import User from '../models/User';
import MeetingRoom from '../models/MeetingRoom';
import Company from '../models/Company';

export class PdfService {
  static async generateFoodOrderPdf(foodOrder: FoodOrder): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const buffers: Buffer[] = [];
        
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });
        doc.on('error', (err) => {
          reject(err);
        });

        const fontAngsana = path.join(__dirname, '../../fonts/angsana.ttc');
        doc.registerFont('AngsanaUPC', fontAngsana, 'AngsanaUPC');
        doc.registerFont('AngsanaUPC-Bold', fontAngsana, 'AngsanaUPC-Bold');
        
        let approver = null;
        if (foodOrder.food_approved_by) {
          approver = await User.findByPk(foodOrder.food_approved_by);
        }
        
        // Fetch associated Booking
        const booking = await Booking.findByPk(foodOrder.booking_id, {
          include: [
            { model: User, as: 'User' },
            { model: MeetingRoom, as: 'Room' }
          ]
        });
        
        let yPos = 40;
        const leftCol = 40;
        
        // Header
        doc.font('AngsanaUPC-Bold').fontSize(22).text('ใบจองอาหาร', leftCol, yPos, { align: 'center' });
        yPos += 25;
        
        doc.font('AngsanaUPC').fontSize(16);
        doc.text(`รหัสการจองห้องประชุม: ${booking?.booking_no || ''}`, leftCol, yPos);
        doc.text(`บริษัท: ${foodOrder.company_name || ''}`, 280, yPos);
        yPos += 20;
        
        doc.text(`หัวข้อการประชุม: ${booking?.booking_name || ''}`, leftCol, yPos);
        yPos += 20;
        
        const bookerName = booking?.is_guest_booking ? (booking.guest_name || '') : `${booking?.User?.first_name || ''} ${booking?.User?.last_name || ''}`;
        const deptName = booking?.is_guest_booking ? (booking.guest_department_name || '') : (booking?.User?.department_name || '');
        const deptCode = booking?.is_guest_booking ? (booking.guest_department_code || '') : (booking?.User?.department_code || '');
        const phoneStr = booking?.is_guest_booking ? (booking.guest_phone || '') : (booking?.User?.mobile_phone || booking?.User?.office_phone || '');

        doc.text(`ชื่อผู้จอง: ${bookerName}`, leftCol, yPos);
        doc.text(`แผนก: ${deptName}`, 200, yPos);
        doc.text(`รหัสแผนก: ${deptCode}`, 320, yPos);
        doc.text(`โทร: ${phoneStr}`, 420, yPos);
        yPos += 20;

        const dateStr = booking?.booking_date ? new Date(booking.booking_date).toLocaleDateString('th-TH') : '';
        const roomName = booking?.Room?.room_name ? booking.Room.room_name : `รหัสห้อง ${booking?.room_id || ''}`;
        doc.text(`ห้องประชุม: ${roomName}`, leftCol, yPos);
        doc.text(`วันที่ประชุม: ${dateStr}`, 250, yPos);
        doc.text(`เวลา: ${booking?.start_time || ''} - ${booking?.end_time || ''}`, 400, yPos);
        yPos += 20;

        doc.text(`เพื่อ: ${booking?.purpose || ''}`, leftCol, yPos);
        yPos += 30;

        // Parse items
        let breakfastItems: string[] = [];
        let lunchItems: string[] = [];
        let afternoonItems: string[] = [];
        let internalCompanies: string[] = [];
        
        try {
          if (foodOrder.breakfast_items) breakfastItems = JSON.parse(foodOrder.breakfast_items);
          if (foodOrder.lunch_items) lunchItems = JSON.parse(foodOrder.lunch_items);
          if (foodOrder.afternoon_items) afternoonItems = JSON.parse(foodOrder.afternoon_items);
          if (foodOrder.internal_companies) internalCompanies = JSON.parse(foodOrder.internal_companies);
        } catch (e) {
          console.error('Error parsing JSON for PDF', e);
        }

        // --- Breakfast Section ---
        const breakfastTimeText = foodOrder.breakfast_time ? `................ ${foodOrder.breakfast_time} ................` : `................................................`;
        doc.font('AngsanaUPC-Bold').fontSize(16).text(`รายการอาหารเช้าเวลา ${breakfastTimeText}`, leftCol, yPos);
        yPos += 20;
        doc.font('AngsanaUPC');
        // Render breakfast in a 3-column grid (6 items)
        for (let i = 0; i < 6; i++) {
          const text = (i < breakfastItems.length && breakfastItems[i].trim() !== '') ? breakfastItems[i] : '...........................................';
          const col = i % 3;
          const row = Math.floor(i / 3);
          doc.text(`${i + 1}. ${text}`, leftCol + (col * 170), yPos + (row * 20));
        }
        yPos += 50;

        // --- Lunch Section ---
        const lunchTimeText = foodOrder.lunch_time ? `................ ${foodOrder.lunch_time} ................` : `................................................`;
        doc.font('AngsanaUPC-Bold').fontSize(16).text(`รายการอาหารเที่ยงเวลา ${lunchTimeText}`, leftCol, yPos);
        yPos += 20;
        doc.font('AngsanaUPC');
        // Render lunches in a 2-column or 3-column grid (up to 9 items, 3 rows of 3)
        // Since 9 items: we can do 3 columns:
        for (let i = 0; i < 9; i++) {
          const text = (i < lunchItems.length && lunchItems[i].trim() !== '') ? lunchItems[i] : '...........................................';
          const col = i % 3;
          const row = Math.floor(i / 3);
          doc.text(`${i + 1}. ${text}`, leftCol + (col * 170), yPos + (row * 20));
        }
        yPos += 70;

        // --- Afternoon Snack Section ---
        const afternoonTimeText = foodOrder.afternoon_time ? `................ ${foodOrder.afternoon_time} ................` : `................................................`;
        doc.font('AngsanaUPC-Bold').fontSize(16).text(`รายการอาหารบ่ายเวลา ${afternoonTimeText}`, leftCol, yPos);
        yPos += 20;
        doc.font('AngsanaUPC');
        // Render afternoon in a 3-column grid (6 items)
        for (let i = 0; i < 6; i++) {
          const text = (i < afternoonItems.length && afternoonItems[i].trim() !== '') ? afternoonItems[i] : '...........................................';
          const col = i % 3;
          const row = Math.floor(i / 3);
          doc.text(`${i + 1}. ${text}`, leftCol + (col * 170), yPos + (row * 20));
        }
        yPos += 50;

        // --- Diners Section ---
        doc.font('AngsanaUPC-Bold').text('ผู้รับประทานอาหาร', leftCol, yPos);
        yPos += 20;
        
        // Two columns
        const col1X = leftCol;
        const col2X = leftCol + 230;
        
        // Fetch internal companies from DB
        const dbCompanies = await Company.findAll();
        const comps = dbCompanies.map(c => c.company_code);
        
        // Column headers
        doc.font('AngsanaUPC-Bold');
        const customerCompanyText = foodOrder.customer_company 
          ? `ลูกค้า ${foodOrder.customer_company}` 
          : 'ลูกค้าบริษัท .................................... (สำหรับลูกค้านอก)';
        doc.text(customerCompanyText, col1X, yPos, { width: 250 });
        
        // Draw only selected companies
        const compY = yPos;
        const selectedComps = internalCompanies.length > 0 ? internalCompanies.join(', ') : 'ไม่มี';
        doc.text(`บริษัทกลุ่ม: ${selectedComps}`, col2X, compY);
        
        yPos += 35;
        
        // Diner lists
        doc.font('AngsanaUPC');
        let guests: any[] = [];
        let internals: any[] = [];
        if ((foodOrder as any).Diners) {
          guests = (foodOrder as any).Diners.filter((d: any) => d.diner_type === 'guest');
          internals = (foodOrder as any).Diners.filter((d: any) => d.diner_type === 'internal');
        }

        const listStartY = yPos;
        // Print 10 lines for guests
        for (let i = 0; i < 10; i++) {
          const guest = guests[i];
          if (guest) {
            doc.text(`${i + 1}. ชื่อ ${guest.diner_name}`, col1X, yPos, { lineBreak: false, width: 250 });
          } else {
            doc.text(`${i + 1}. ชื่อ.....................................................................`, col1X, yPos);
          }
          yPos += 18;
        }
        
        // Reset yPos and print 10 lines for internals
        yPos = listStartY;
        for (let i = 0; i < 10; i++) {
          const intD = internals[i];
          if (intD) {
            let str = `${i + 1}. ชื่อ ${intD.diner_name}`;
            if (intD.department) str += ` แผนก ${intD.department}`;
            if (intD.department_code) str += ` รหัสแผนก ${intD.department_code}`;
            doc.text(str, col2X, yPos, { lineBreak: false, width: 310 });
          } else {
            doc.text(`${i + 1}. ชื่อ.............................แผนก.................รหัสแผนก.............`, col2X, yPos);
          }
          yPos += 18;
        }
        
        yPos = Math.max(listStartY + (10 * 18), yPos) + 10;
        
        if (foodOrder.additional_notes) {
          doc.font('AngsanaUPC-Bold').text(`หมายเหตุเพิ่มเติม: ${foodOrder.additional_notes}`, leftCol, yPos);
        } else {
          doc.font('AngsanaUPC-Bold').text(`หมายเหตุเพิ่มเติม: ....................................................................................................`, leftCol, yPos);
        }

        // Draw Signatures Block at bottom
        let blockY = doc.page.height - 110; 
        doc.font('AngsanaUPC').fontSize(14);
        
        // Requester (Left)
        doc.text('ลงชื่อ.............................................', 40, blockY, { width: 150, align: 'center' });
        const sigBookerName = booking?.is_guest_booking ? (booking.guest_name || '.......................................') : `${booking?.User?.first_name || '.......................................'} ${booking?.User?.last_name || ''}`;
        doc.text(`(${sigBookerName})`, 40, blockY + 20, { width: 150, align: 'center' });
        doc.text('ลงชื่อผู้จอง', 40, blockY + 40, { width: 150, align: 'center' });
        
        // Approver (Center)
        doc.text('ลงชื่อ.............................................', 230, blockY, { width: 150, align: 'center' });
        const approverName = '.......................................';
        doc.text(`(${approverName})`, 230, blockY + 20, { width: 150, align: 'center' });
        doc.text('ลงชื่อผู้อนุมัติ(ผู้จัดการ)', 230, blockY + 40, { width: 150, align: 'center' });
        
        // Certifier (Right)
        doc.text('ลงชื่อ.............................................', 400, blockY, { width: 150, align: 'center' });
        doc.text('(.......................................)', 400, blockY + 20, { width: 150, align: 'center' });
        doc.text('ลงชื่อผู้รับจอง', 400, blockY + 40, { width: 150, align: 'center' });
        
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
