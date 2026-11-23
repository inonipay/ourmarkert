import { z } from "zod";
import { readJsonBody } from "@/lib/http/read-json-body";

export type ParsedJsonRequest<Schema extends z.ZodType> =
  | { success: true; data: z.infer<Schema> }
  | { success: false; response: Response };

export async function parseJsonRequest<Schema extends z.ZodType>(
  request: Request,
  schema: Schema,
  maxBytes = 16_384,
): Promise<ParsedJsonRequest<Schema>> {
  const contentType = request.headers
    .get("content-type")
    ?.split(";")[0]
    .trim()
    .toLowerCase();
  if (contentType !== "application/json") {
    return {
      success: false,
      response: Response.json(
        { error: "Content-Type must be application/json" },
        { status: 415 },
      ),
    };
  }

  const body = await readJsonBody(request, maxBytes);
  if (!body.success) {
    return {
      success: false,
      response: Response.json(
        {
          error:
            body.reason === "too-large"
              ? "Request body is too large"
              : "Invalid JSON request body",
        },
        { status: body.reason === "too-large" ? 413 : 400 },
      ),
    };
  }

  const parsed = schema.safeParse(body.value);
  if (!parsed.success) {
    return {
      success: false,
      response: Response.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 },
      ),
    };
  }

  return { success: true, data: parsed.data };
}
