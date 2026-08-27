import sequelize from './src/config/database';

sequelize.query("SELECT b.booking_no, u.first_name, u.last_name, u.email, u.phone, u.company_code, u.department, b.is_guest_booking, b.guest_name, b.guest_email, b.guest_phone, b.guest_company_id, b.guest_department_code, b.guest_department_name FROM bookings b LEFT JOIN users u ON b.user_id = u.id WHERE b.booking_no = 'BK-20260804-C70A'").then(res => { console.log(res[0]); process.exit(0); });
