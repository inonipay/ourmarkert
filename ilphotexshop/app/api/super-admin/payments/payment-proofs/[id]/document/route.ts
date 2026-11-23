import {
  authorizationErrorResponse,
  requireUserRole,
} from "@/lib/authorization";
import { getSuperAdminPaymentProofDocument } from "@/lib/data-access/order-payment-proofs";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { paymentProofIdSchema } from "@/lib/validation/payment-proofs";

type PaymentProofDocumentRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: Request,
  context: PaymentProofDocumentRouteContext,
) {
  try {
    await requireUserRole("super_admin");
    const { id } = await context.params;
    const parsedId = paymentProofIdSchema.safeParse(id);
    if (!parsedId.success) {
      return Response.json({ error: "Invalid payment proof ID" }, { status: 400 });
    }

    const document = await getSuperAdminPaymentProofDocument(parsedId.data);
    if (!document) {
      return Response.json({ error: "Payment proof document not found" }, { status: 404 });
    }

    const fileName = document.documentName.replace(/[\r\n"\\]/g, "_");
    return new Response(new Uint8Array(document.document), {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        "Content-Length": String(document.document.byteLength),
        "Content-Type": document.documentMimeType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const authorizationResponse = authorizationErrorResponse(error);
    if (authorizationResponse) return authorizationResponse;
    return apiErrorResponse(
      error,
      "Failed to download payment proof document",
      "Payment receipt could not be downloaded",
    );
  }
}
