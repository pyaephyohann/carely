/**
 * Appointment email templates.
 */

import { baseEmailTemplate } from "./base";
import { appUrl } from "../email-service";

export function appointmentBookedEmail(data: {
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  type: string;
}): string {
  const content = `
    <p style="margin:0 0 16px;">Hi ${data.patientName},</p>
    <p style="margin:0 0 16px;">Your appointment has been successfully booked.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;background-color:#f4f4f5;border-radius:8px;padding:16px;">
      <tr><td style="font-size:13px;color:#71717a;padding:4px 0;"><strong>Doctor</strong></td><td style="font-size:14px;color:#18181b;padding:4px 0;">Dr. ${data.doctorName}</td></tr>
      <tr><td style="font-size:13px;color:#71717a;padding:4px 0;"><strong>Date</strong></td><td style="font-size:14px;color:#18181b;padding:4px 0;">${data.date}</td></tr>
      <tr><td style="font-size:13px;color:#71717a;padding:4px 0;"><strong>Time</strong></td><td style="font-size:14px;color:#18181b;padding:4px 0;">${data.time}</td></tr>
      <tr><td style="font-size:13px;color:#71717a;padding:4px 0;"><strong>Type</strong></td><td style="font-size:14px;color:#18181b;padding:4px 0;">${data.type}</td></tr>
    </table>
    <p style="margin:0;color:#71717a;font-size:14px;">You can view and manage your appointment in the Carely app.</p>
  `;
  return baseEmailTemplate("Appointment Booked", content, "View Appointment", appUrl("/patient/appointments"));
}

export function appointmentConfirmedEmail(data: {
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
}): string {
  const content = `
    <p style="margin:0 0 16px;">Hi ${data.patientName},</p>
    <p style="margin:0 0 16px;">Dr. ${data.doctorName} has confirmed your appointment.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;background-color:#f4f4f5;border-radius:8px;padding:16px;">
      <tr><td style="font-size:13px;color:#71717a;padding:4px 0;"><strong>Date</strong></td><td style="font-size:14px;color:#18181b;padding:4px 0;">${data.date}</td></tr>
      <tr><td style="font-size:13px;color:#71717a;padding:4px 0;"><strong>Time</strong></td><td style="font-size:14px;color:#18181b;padding:4px 0;">${data.time}</td></tr>
    </table>
  `;
  return baseEmailTemplate("Appointment Confirmed", content, "View Appointment", appUrl("/patient/appointments"));
}

export function appointmentCancelledEmail(data: {
  recipientName: string;
  cancelledByName: string;
  date: string;
  time: string;
  reason?: string;
}): string {
  const content = `
    <p style="margin:0 0 16px;">Hi ${data.recipientName},</p>
    <p style="margin:0 0 16px;">The following appointment has been cancelled by ${data.cancelledByName}:</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;background-color:#fef2f2;border-radius:8px;padding:16px;border:1px solid #fecaca;">
      <tr><td style="font-size:13px;color:#71717a;padding:4px 0;"><strong>Date</strong></td><td style="font-size:14px;color:#18181b;padding:4px 0;">${data.date}</td></tr>
      <tr><td style="font-size:13px;color:#71717a;padding:4px 0;"><strong>Time</strong></td><td style="font-size:14px;color:#18181b;padding:4px 0;">${data.time}</td></tr>
      ${data.reason ? `<tr><td style="font-size:13px;color:#71717a;padding:4px 0;"><strong>Reason</strong></td><td style="font-size:14px;color:#18181b;padding:4px 0;">${data.reason}</td></tr>` : ""}
    </table>
  `;
  return baseEmailTemplate("Appointment Cancelled", content, "View Appointments", appUrl("/patient/appointments"));
}

export function appointmentReminderEmail(data: {
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  hoursUntil: number;
}): string {
  const timeLabel = data.hoursUntil <= 1 ? "1 hour" : `${data.hoursUntil} hours`;
  const content = `
    <p style="margin:0 0 16px;">Hi ${data.patientName},</p>
    <p style="margin:0 0 16px;">This is a friendly reminder that you have an appointment in <strong>${timeLabel}</strong>.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;background-color:#eff6ff;border-radius:8px;padding:16px;border:1px solid #bfdbfe;">
      <tr><td style="font-size:13px;color:#71717a;padding:4px 0;"><strong>Doctor</strong></td><td style="font-size:14px;color:#18181b;padding:4px 0;">Dr. ${data.doctorName}</td></tr>
      <tr><td style="font-size:13px;color:#71717a;padding:4px 0;"><strong>Date</strong></td><td style="font-size:14px;color:#18181b;padding:4px 0;">${data.date}</td></tr>
      <tr><td style="font-size:13px;color:#71717a;padding:4px 0;"><strong>Time</strong></td><td style="font-size:14px;color:#18181b;padding:4px 0;">${data.time}</td></tr>
    </table>
  `;
  return baseEmailTemplate("Appointment Reminder", content, "View Appointment", appUrl("/patient/appointments"));
}
