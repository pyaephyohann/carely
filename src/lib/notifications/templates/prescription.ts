/**
 * Prescription email templates.
 */

import { baseEmailTemplate } from "./base";
import { appUrl } from "../email-service";

export function prescriptionFinalizedEmail(data: {
  patientName: string;
  doctorName: string;
  diagnosis: string;
  itemCount: number;
}): string {
  const content = `
    <p style="margin:0 0 16px;">Hi ${data.patientName},</p>
    <p style="margin:0 0 16px;">Dr. ${data.doctorName} has finalized a prescription for you.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;background-color:#f0fdf4;border-radius:8px;padding:16px;border:1px solid #bbf7d0;">
      <tr><td style="font-size:13px;color:#71717a;padding:4px 0;"><strong>Diagnosis</strong></td><td style="font-size:14px;color:#18181b;padding:4px 0;">${data.diagnosis}</td></tr>
      <tr><td style="font-size:13px;color:#71717a;padding:4px 0;"><strong>Medications</strong></td><td style="font-size:14px;color:#18181b;padding:4px 0;">${data.itemCount} medicine${data.itemCount !== 1 ? "s" : ""}</td></tr>
    </table>
    <p style="margin:0;color:#71717a;font-size:14px;">You can view the full prescription and find a pharmacy in the Carely app.</p>
  `;
  return baseEmailTemplate("New Prescription", content, "View Prescription", appUrl("/patient/prescriptions"));
}
