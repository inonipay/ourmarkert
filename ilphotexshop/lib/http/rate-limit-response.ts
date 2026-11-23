import type { RateLimitResult } from "@/lib/rate-limit";

export function rateLimitResponse(
  result: Extract<RateLimitResult, { allowed: false }>,
  resource: string,
): Response {
  if (result.reason === "unconfigured") {
    return Response.json(
      { error: `${resource} rate limiting is not configured` },
      { status: 503 },
    );
  }

  return Response.json(
    { error: `Too many ${resource} requests` },
    {
      status: 429,
      headers: {
        "Retry-After": String(
          Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
        ),
      },
    },
  );
}
