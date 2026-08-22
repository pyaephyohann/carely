import { prisma } from "@/lib/prisma";
import { requireDatabase, apiSuccess } from "@/lib/api";

// =============================================================================
// GET /api/specializations — Public specializations list
// =============================================================================

export async function GET() {
  const dbCheck = requireDatabase();
  if (dbCheck) return dbCheck;

  const specializations = await prisma!.specialization.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  return apiSuccess(specializations);
}
