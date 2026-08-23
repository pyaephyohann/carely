/**
 * Pharmacy fulfillment email templates.
 */

import { baseEmailTemplate } from "./base";
import { appUrl } from "../email-service";

export function pharmacyFulfillmentReceivedEmail(data: {
  patientName: string;
  pharmacyName: string;
  diagnosis: string;
}): string {
  const content = `
    <p style="margin:0 0 16px;">Hi ${data.patientName},</p>
    <p style="margin:0 0 16px;">Your prescription has been submitted to <strong>${data.pharmacyName}</strong> for fulfillment.</p>
    <p style="margin:0;color:#71717a;font-size:14px;">You'll be notified when the pharmacy processes your request.</p>
  `;
  return baseEmailTemplate("Prescription Submitted", content, "View Order", appUrl("/patient/pharmacy-orders"));
}

export function pharmacyFulfillmentAcceptedEmail(data: {
  patientName: string;
  pharmacyName: string;
}): string {
  const content = `
    <p style="margin:0 0 16px;">Hi ${data.patientName},</p>
    <p style="margin:0 0 16px;"><strong>${data.pharmacyName}</strong> has accepted your prescription and is preparing your medications.</p>
  `;
  return baseEmailTemplate("Prescription Accepted", content, "View Order", appUrl("/patient/pharmacy-orders"));
}

export function pharmacyFulfillmentRejectedEmail(data: {
  patientName: string;
  pharmacyName: string;
  reason: string;
}): string {
  const content = `
    <p style="margin:0 0 16px;">Hi ${data.patientName},</p>
    <p style="margin:0 0 16px;"><strong>${data.pharmacyName}</strong> was unable to fulfill your prescription.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;background-color:#fef2f2;border-radius:8px;padding:16px;border:1px solid #fecaca;">
      <tr><td style="font-size:13px;color:#71717a;padding:4px 0;"><strong>Reason</strong></td><td style="font-size:14px;color:#18181b;padding:4px 0;">${data.reason}</td></tr>
    </table>
    <p style="margin:0;color:#71717a;font-size:14px;">You can try submitting to another pharmacy from your prescriptions.</p>
  `;
  return baseEmailTemplate("Prescription Rejected", content, "Find Another Pharmacy", appUrl("/patient/prescriptions"));
}

export function pharmacyFulfillmentReadyEmail(data: {
  patientName: string;
  pharmacyName: string;
}): string {
  const content = `
    <p style="margin:0 0 16px;">Hi ${data.patientName},</p>
    <p style="margin:0 0 16px;">Great news! Your medications at <strong>${data.pharmacyName}</strong> are ready for pickup.</p>
  `;
  return baseEmailTemplate("Prescription Ready", content, "View Details", appUrl("/patient/pharmacy-orders"));
}

export function pharmacyFulfillmentCompletedEmail(data: {
  patientName: string;
  pharmacyName: string;
}): string {
  const content = `
    <p style="margin:0 0 16px;">Hi ${data.patientName},</p>
    <p style="margin:0 0 16px;">Your prescription has been completed by <strong>${data.pharmacyName}</strong>.</p>
  `;
  return baseEmailTemplate("Prescription Completed", content, "View Order", appUrl("/patient/pharmacy-orders"));
}
