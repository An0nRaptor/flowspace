import nodemailer from "nodemailer";
import { config } from "./app-config";

const isMailConfigured = config.SMTP_HOST !== "none";

const transporter = isMailConfigured
  ? nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: Number(config.SMTP_PORT),
      secure: Number(config.SMTP_PORT) === 465,
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS,
      },
    })
  : null;

export const sendMail = async (mail: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) => {
  if (!transporter) {
    console.log(
      `[mail] SMTP not configured. Skipped "${mail.subject}" to ${mail.to}`
    );
    return;
  }

  try {
    await transporter.sendMail({ from: config.MAIL_FROM, ...mail });
  } catch (error) {
    console.error(
      `[mail] Failed to send "${mail.subject}" to ${mail.to}`,
      error
    );
  }
};
