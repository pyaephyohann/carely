import { describe, expect, it } from "vitest";
import { resolveThemePreference } from "@/components/theme/theme-provider";

describe("resolveThemePreference", () => {
  it("returns light when preference is light", () => {
    expect(resolveThemePreference("light", "dark")).toBe("light");
  });

  it("returns dark when preference is dark", () => {
    expect(resolveThemePreference("dark", "light")).toBe("dark");
  });

  it("follows system theme when preference is system", () => {
    expect(resolveThemePreference("system", "light")).toBe("light");
    expect(resolveThemePreference("system", "dark")).toBe("dark");
  });

  it("defaults system resolution to light when system theme is omitted", () => {
    expect(resolveThemePreference("system")).toBe("light");
  });
});
