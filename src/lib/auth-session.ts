/**
 * Client-side auth session helpers.
 * Single-flight refresh so concurrent 401s share one /api/auth/refresh call.
 */

let refreshInFlight: Promise<boolean> | null = null;

function authLog(message: string): void {
  if (process.env.NODE_ENV !== "production") {
    console.info(`[AUTH] ${message}`);
  }
}

/**
 * Attempt to rotate access (+ refresh) cookies via the refresh endpoint.
 * Returns true when the session was successfully renewed.
 * Never logs tokens or cookie values.
 */
export async function refreshAuthSession(): Promise<boolean> {
  if (refreshInFlight) {
    authLog("Refresh already in flight — awaiting existing attempt");
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    try {
      authLog("Session refresh attempted");
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "same-origin",
      });

      if (response.ok) {
        authLog("Session refresh succeeded");
        return true;
      }

      authLog(`Session refresh failed (status ${response.status})`);
      return false;
    } catch {
      authLog("Session refresh failed (network error)");
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export { authLog };
