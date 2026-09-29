// src/lib/toolcall/message.ts
import nodemailer from "nodemailer";
import { SendMailOptions, Transporter } from "nodemailer";

// Email
const transporter: Transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function email(options: SendMailOptions) {
  try {
      const info = await transporter.sendMail(options);
      console.log("Message sent: %s", info.messageId);
  } catch (error) {
      console.error("Error sending email:", error);
  }
}

export function sms_text() {
  // Twilio can't send SMS text verification for me
  // Clicksend not sending me SMS text verification
  // Not using AWS SNS Client for this
}