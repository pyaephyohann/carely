import { buildClearAuthCookies, applySetCookieHeaders } from "@/lib/auth";
import { apiSuccess } from "@/lib/api";

export async function POST() {
  const response = apiSuccess({ message: "Logged out successfully" });

  applySetCookieHeaders(response.headers, buildClearAuthCookies());

  return response;
}
