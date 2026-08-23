import { prisma } from "@/lib/prisma";
import {
  getRefreshTokenFromCookies,
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken,
  setAccessTokenCookie,
  setRefreshTokenCookie,
} from "@/lib/auth";
import { requireDatabase, apiError, apiSuccess } from "@/lib/api";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { logError } from "@/lib/logger";

export async function POST(request: Request) {
  // Rate limit: 20 refresh attempts per minute per IP
  const rlKey = getRateLimitKey(request, "refresh");
  const rl = rateLimit(rlKey, { max: 20, windowMs: 60_000 });
  if (!rl.allowed) {
    return apiError("Too many requests. Please try again later.", "RATE_LIMITED", 429);
  }

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

    // Issue new access token AND rotate refresh token
    const accessToken = await signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    const newRefreshToken = await signRefreshToken(user.id);

    const response = apiSuccess({ accessToken });

    // Rotate cookies: new access token + new refresh token
    let newCookies = setAccessTokenCookie(
      response.headers.get("set-cookie") || "",
      accessToken,
    );
    newCookies = setRefreshTokenCookie(newCookies, newRefreshToken);
    response.headers.set("set-cookie", newCookies);

    return response;
  } catch (error) {
    logError("Token refresh error", error);
    return apiError("An unexpected error occurred");
  }
}
