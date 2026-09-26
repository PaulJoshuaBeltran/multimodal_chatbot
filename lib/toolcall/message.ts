// lib/toolcall/message.ts

// npm install dotenv@^16.4.5
// npm install nodemailer

import nodemailer from "nodemailer";
import { SendMailOptions, Transporter } from "nodemailer";

const transporter: Transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// 2. Define your email options safely typed
// const mailOptions: SendMailOptions = {
//   from: 'paulbeltran123456@gmail.com',
//   to: "joshpaulbeltran654321@gmail.com",
//   subject: "Testing TypeScript Email",
//   text: "Hello from TypeScript!",
//   html: "<b>Hello from TypeScript!</b>",
// };

export async function email(options: SendMailOptions) {
  try {
      const info = await transporter.sendMail(options);
      console.log("Message sent: %s", info.messageId);
  } catch (error) {
      console.error("Error sending email:", error);
  }
}

export function sms_text() {

}