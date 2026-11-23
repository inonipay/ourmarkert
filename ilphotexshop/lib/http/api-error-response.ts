import { authorizationErrorResponse } from "@/lib/authorization";

export function apiErrorResponse(
  error: unknown,
  logMessage: string,
  publicMessage: string,
) {
  const authorizationResponse = authorizationErrorResponse(error);
  if (authorizationResponse) return authorizationResponse;

  console.error(logMessage, error);
  return Response.json({ error: publicMessage }, { status: 500 });
}
