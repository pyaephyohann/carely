import { describe, expect, it } from "vitest";
import {
  buildAccessTokenCookie,
  buildRefreshTokenCookie,
  buildAuthCookies,
  buildClearAuthCookies,
  applySetCookieHeaders,
  parseCookies,
  getAccessTokenFromCookies,
  getRefreshTokenFromCookies,
  ACCESS_TOKEN_NAME,
  REFRESH_TOKEN_NAME,
} from "@/lib/auth";

describe("auth cookie helpers", () => {
  it("builds separate access and refresh Set-Cookie values", () => {
    const cookies = buildAuthCookies("access-token-value", "refresh-token-value");

    expect(cookies).toHaveLength(2);
    expect(cookies[0]).toContain(`${ACCESS_TOKEN_NAME}=access-token-value`);
    expect(cookies[1]).toContain(`${REFRESH_TOKEN_NAME}=refresh-token-value`);
    expect(cookies[0]).toContain("HttpOnly");
    expect(cookies[1]).toContain("HttpOnly");
    expect(cookies[0]).toContain("SameSite=Lax");
    expect(cookies[0]).toContain("Max-Age=900");
  });

  it("appends each cookie as its own Set-Cookie header", () => {
    const headers = new Headers();
    applySetCookieHeaders(headers, buildAuthCookies("a", "r"));

    const setCookies =
      typeof headers.getSetCookie === "function"
        ? headers.getSetCookie()
        : [headers.get("set-cookie") || ""];

    expect(setCookies.length).toBeGreaterThanOrEqual(1);

    const joined = setCookies.join("\n");
    expect(joined).toContain(`${ACCESS_TOKEN_NAME}=a`);
    expect(joined).toContain(`${REFRESH_TOKEN_NAME}=r`);
  });

  it("does not pack both cookies into a single semicolon-joined string for Set-Cookie", () => {
    // Regression: previously setAuthCookies joined cookies with "; ",
    // which browsers treat as one cookie (refresh never stored).
    const cookies = buildAuthCookies("access", "refresh");
    expect(cookies[0].includes(`${REFRESH_TOKEN_NAME}=`)).toBe(false);
    expect(cookies[1].includes(`${ACCESS_TOKEN_NAME}=`)).toBe(false);
  });

  it("builds clear cookies with Max-Age=0", () => {
    const cleared = buildClearAuthCookies();
    expect(cleared).toHaveLength(2);
    expect(cleared[0]).toContain("Max-Age=0");
    expect(cleared[1]).toContain("Max-Age=0");
  });

  it("parses request Cookie header for both tokens", () => {
    const header = `${ACCESS_TOKEN_NAME}=abc; ${REFRESH_TOKEN_NAME}=xyz`;
    expect(parseCookies(header)[ACCESS_TOKEN_NAME]).toBe("abc");
    expect(getAccessTokenFromCookies(header)).toBe("abc");
    expect(getRefreshTokenFromCookies(header)).toBe("xyz");
  });

  it("supports remember-me refresh max-age", () => {
    const normal = buildRefreshTokenCookie("rt");
    const remembered = buildRefreshTokenCookie("rt", true);
    expect(normal).toContain(`Max-Age=${7 * 24 * 60 * 60}`);
    expect(remembered).toContain(`Max-Age=${30 * 24 * 60 * 60}`);
  });

  it("builds access cookie independently", () => {
    const cookie = buildAccessTokenCookie("tok");
    expect(cookie.startsWith(`${ACCESS_TOKEN_NAME}=tok;`)).toBe(true);
  });
});
