import { logError } from "@/lib/logger";
/**
 * Email service with provider abstraction.
 *
 * Architecture:
 *   Application → EmailService → Provider (Resend / SMTP / Console)
 *
 * EMAIL_ENABLED=false by default in development.
 * Production must explicitly enable via EMAIL_ENABLED=true + provider config.
 *
 * All email failures are logged to EmailDeliveryLog and never break business operations.
 */

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// =============================================================================
// Configuration
// =============================================================================

const EMAIL_ENABLED = process.env.EMAIL_ENABLED === "true";
const EMAIL_FROM = process.env.EMAIL_FROM || "Carely <noreply@carely.health>";
const EMAIL_PROVIDER_API_KEY = process.env.EMAIL_PROVIDER_API_KEY || "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// =============================================================================
// Types
// =============================================================================

export interface SendEmailInput {
  userId?: string;
  to: string;
  subject: string;
  html: string;
  type: string;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// Provider: Resend API
// =============================================================================

async function sendViaResend(to: string, subject: string, html: string): Promise<{ id: string }> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${EMAIL_PROVIDER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Resend API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  return { id: data.id };
}

// =============================================================================
// Core: Send Email (with delivery logging)
// =============================================================================

export async function sendNotificationEmail(input: SendEmailInput): Promise<void> {
  const { userId, to, subject, html, type, metadata } = input;

  // Skip if email is disabled
  if (!EMAIL_ENABLED) {
    console.log(`[Email] Disabled — would send "${subject}" to ${to}`);
    return;
  }

  // Skip if no provider configured
  if (!EMAIL_PROVIDER_API_KEY) {
    console.warn("[Email] No EMAIL_PROVIDER_API_KEY configured");
    return;
  }

  // Create delivery log entry
  let logId: string | null = null;
  try {
    if (prisma) {
      const log = await prisma.emailDeliveryLog.create({
        data: {
          userId: userId || null,
          to,
          subject,
          type,
          status: "PENDING",
          metadata: (metadata as Prisma.InputJsonValue) || Prisma.JsonNull,
        },
      });
      logId = log.id;
    }
  } catch (err) {
    logError("[Email] Failed to create delivery log:", err);
  }

  // Send via provider
  try {
    const result = await sendViaResend(to, subject, html);

    // Update log: success
    if (logId && prisma) {
      await prisma.emailDeliveryLog.update({
        where: { id: logId },
        data: {
          status: "SENT",
          providerId: result.id,
          sentAt: new Date(),
        },
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logError(`[Email] Delivery failed: ${errorMessage}`);

    // Update log: failure
    if (logId && prisma) {
      await prisma.emailDeliveryLog.update({
        where: { id: logId },
        data: {
          status: "FAILED",
          error: errorMessage,
        },
      });
    }
  }
}

// =============================================================================
// Helper: Build full URL for email CTAs
// =============================================================================

export function appUrl(path: string): string {
  return `${APP_URL}${path}`;
}
