import nodemailer from 'nodemailer';

const isDev = process.env.NODE_ENV === 'development';

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'thongchaiindustries.co.th',
    host: process.env.SMTP_HOST || 'mail.thairadiator.co.th',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || 'itss@thongchai.th.com',
      pass: process.env.SMTP_PASSWORD || 'ew6tf5',
    },
  });
};

export const mailConfig = {
  from: process.env.SMTP_FROM || '"NatPrachum TCI" <itss@thongchai.th.com>',
  transporter: createTransporter(),
  isDev,
};
