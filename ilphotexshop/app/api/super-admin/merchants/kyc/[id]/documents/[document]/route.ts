import {
  authorizationErrorResponse,
  requireUserRole,
} from "@/lib/authorization";
import { getSuperAdminMerchantKycDocument } from "@/lib/data-access/merchant-kyc";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { merchantKycIdSchema } from "@/lib/validation/merchant-kyc";

type MerchantKycDocumentContext = {
  params: Promise<{ id: string; document: string }>;
};

export async function GET(
  _request: Request,
  context: MerchantKycDocumentContext,
) {
  try {
    await requireUserRole("super_admin");
    const { id, document } = await context.params;
    const parsedId = merchantKycIdSchema.safeParse(id);
    if (!parsedId.success) {
      return Response.json({ error: "Invalid application ID" }, { status: 400 });
    }
    if (document !== "registration" && document !== "identity") {
      return Response.json({ error: "Invalid document type" }, { status: 400 });
    }

    const file = await getSuperAdminMerchantKycDocument(
      parsedId.data,
      document,
    );
    if (!file) {
      return Response.json({ error: "Document not found" }, { status: 404 });
    }

    const safeFileName = file.fileName.replace(/[\r\n"\\]/g, "_");
    return new Response(new Uint8Array(file.bytes), {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `attachment; filename="${safeFileName}"; filename*=UTF-8''${encodeURIComponent(safeFileName)}`,
        "Content-Length": String(file.bytes.byteLength),
        "Content-Type": file.mimeType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const authorizationResponse = authorizationErrorResponse(error);
    if (authorizationResponse) return authorizationResponse;
    return apiErrorResponse(
      error,
      "Failed to download KYC document",
      "KYC document could not be downloaded",
    );
  }
}
