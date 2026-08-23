import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { apiSuccess, apiError, requireDatabase } from "@/lib/api";

export async function GET(request: Request) {
  const dbCheck = requireDatabase();
  if (dbCheck) return dbCheck;

  const auth = await requireAdmin(request as never);
  if (!auth.authenticated) return auth.response;

  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
    const status = url.searchParams.get("status") || "";

    const where: Record<string, unknown> = {};

    if (status) where.status = status;

    const [total, fulfillments] = await Promise.all([
      prisma!.prescriptionFulfillment.count({ where }),
      prisma!.prescriptionFulfillment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          pharmacy: {
            select: { id: true, name: true, address: true },
          },
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              user: { select: { email: true } },
            },
          },
          prescription: {
            select: {
              id: true,
              status: true,
              createdAt: true,
              items: { select: { id: true } },
            },
          },
          items: { select: { id: true, fulfilled: true } },
        },
      }),
    ]);

    return apiSuccess(
      fulfillments.map((f) => ({
        id: f.id,
        status: f.status,
        rejectReason: f.rejectReason,
        createdAt: f.createdAt.toISOString(),
        updatedAt: f.updatedAt.toISOString(),
        pharmacy: f.pharmacy,
        patient: {
          id: f.patient.id,
          name: `${f.patient.firstName} ${f.patient.lastName}`,
          email: f.patient.user.email,
        },
        prescription: f.prescription
          ? {
              id: f.prescription.id,
              status: f.prescription.status,
              createdAt: f.prescription.createdAt.toISOString(),
              itemCount: f.prescription.items.length,
            }
          : null,
        itemCount: f.items.length,
        fulfilledCount: f.items.filter((i) => i.fulfilled).length,
      })),
      {
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }
    );
  } catch (error) {
    logError("Admin fulfillments error:", error);
    return apiError("Failed to load fulfillments", "FULFILLMENTS_ERROR", 500);
  }
}
