import { clearAuthCookies } from "@/lib/auth";
import { apiSuccess } from "@/lib/api";

export async function POST() {
  const response = apiSuccess({ message: "Logged out successfully" });

  // Clear auth cookies
  const cookieHeader = response.headers.get("set-cookie") || "";
  const clearedCookies = clearAuthCookies(cookieHeader);
  response.headers.set("set-cookie", clearedCookies);

  return response;
}
