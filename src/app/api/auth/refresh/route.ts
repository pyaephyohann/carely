import { prisma } from "@/lib/prisma";
import {
  getRefreshTokenFromCookies,
  verifyRefreshToken,
  signAccessToken,
  setAccessTokenCookie,
} from "@/lib/auth";
import { requireDatabase, apiError, apiSuccess } from "@/lib/api";

export async function POST(request: Request) {
  try {
    const dbCheck = requireDatabase();
    if (dbCheck) return dbCheck;

    const cookieHeader = request.headers.get("cookie");
    const refreshToken = getRefreshTokenFromCookies(cookieHeader);

    if (!refreshToken) {
      return apiError("No refresh token found", "NO_REFRESH_TOKEN", 401);
    }

    // Verify refresh token
    let payload;
    try {
      payload = await verifyRefreshToken(refreshToken);
    } catch {
      return apiError("Invalid or expired refresh token", "INVALID_REFRESH_TOKEN", 401);
    }

    // Verify user still exists and is active
    const user = await prisma!.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || user.deletedAt) {
      return apiError("User not found", "USER_NOT_FOUND", 401);
    }

    if (user.status !== "ACTIVE") {
      return apiError("Account is not active", "ACCOUNT_INACTIVE", 403);
    }

    // Issue new access token
    const accessToken = await signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const response = apiSuccess({ accessToken });

    // Update access token cookie
    const existingCookies = response.headers.get("set-cookie") || "";
    const newCookies = setAccessTokenCookie(existingCookies, accessToken);
    response.headers.set("set-cookie", newCookies);

    return response;
  } catch (error) {
    console.error("Token refresh error:", error);
    return apiError("An unexpected error occurred");
  }
}
