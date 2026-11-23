import { requireAuthenticatedUser } from "@/lib/authorization";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { parseJsonRequest } from "@/lib/http/parse-json-request";
import { createProductReport } from "@/lib/data-access/super-admin-product-management";
import { productIdSchema, productReportSchema } from "@/lib/validation/products";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const reporter = await requireAuthenticatedUser();
    const { id } = await context.params;
    const parsedId = productIdSchema.safeParse(id);
    if (!parsedId.success) return Response.json({ error: "Invalid product ID" }, { status: 400 });
    const body = await parseJsonRequest(
      request,
      productReportSchema,
    );
    if (!body.success) return body.response;
    if (body.data.productId !== parsedId.data) {
      return Response.json({ error: "Product ID mismatch" }, { status: 400 });
    }
    const report = await createProductReport(reporter.id, parsedId.data, body.data.reason);
    if (!report) return Response.json({ error: "Published product not found" }, { status: 404 });
    return Response.json({ id: report.id, status: report.status }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Failed to report product", "Product report could not be submitted");
  }
}
