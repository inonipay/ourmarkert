import {
  authorizationErrorResponse,
  requireUserRole,
} from "@/lib/authorization";
import {
  getOwnMerchantKycApplication,
  MerchantKycAlreadyExistsError,
  submitMerchantKyc,
} from "@/lib/data-access/merchant-kyc";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { rateLimitResponse } from "@/lib/http/rate-limit-response";
import { checkMerchantKycSubmitLimit } from "@/lib/rate-limit";
import { merchantKycSubmissionSchema } from "@/lib/validation/merchant-kyc";

const maxDocumentBytes = 2 * 1024 * 1024;
const maxFormBytes = maxDocumentBytes * 2 + 64 * 1024;
const allowedDocumentTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

type FormDataResult =
  | { ok: true; form: FormData }
  | { ok: false; status: 400 | 413; error: string };

type DocumentResult =
  | {
      ok: true;
      document: {
        bytes: Uint8Array;
        fileName: string;
        mimeType: string;
      };
    }
  | { ok: false; error: string };

async function readBoundedFormData(request: Request): Promise<FormDataResult> {
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > maxFormBytes) {
    return { ok: false, status: 413, error: "Application files are too large" };
  }
  const contentType = request.headers.get("content-type");
  if (!contentType?.toLowerCase().startsWith("multipart/form-data;")) {
    return { ok: false, status: 400, error: "Invalid multipart form data" };
  }

  const reader = request.body?.getReader();
  if (!reader) {
    return { ok: false, status: 400, error: "Invalid multipart form data" };
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  let tooLarge = false;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxFormBytes) {
        tooLarge = true;
        break;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  if (tooLarge) {
    return { ok: false, status: 413, error: "Application files are too large" };
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    const form = await new Request(request.url, {
      method: "POST",
      headers: { "content-type": contentType },
      body,
    }).formData();
    return { ok: true, form };
  } catch {
    return { ok: false, status: 400, error: "Invalid multipart form data" };
  }
}

function detectDocumentType(bytes: Uint8Array) {
  if (
    bytes.length >= 5 &&
    String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-"
  ) {
    return "application/pdf";
  }
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    String.fromCharCode(...bytes.slice(1, 4)) === "PNG" &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  return null;
}

async function readDocument(
  value: FormDataEntryValue | null,
  label: string,
): Promise<DocumentResult> {
  if (!(value instanceof File)) {
    return { ok: false, error: `${label} document is required` };
  }
  if (!value.size || value.size > maxDocumentBytes) {
    return {
      ok: false,
      error: `${label} document must be smaller than or equal to 2 MB`,
    };
  }
  if (value.type && !allowedDocumentTypes.has(value.type)) {
    return {
      ok: false,
      error: `${label} must be a PDF, JPEG, or PNG file`,
    };
  }

  const bytes = new Uint8Array(await value.arrayBuffer());
  const mimeType = detectDocumentType(bytes);
  if (!mimeType || (value.type && value.type !== mimeType)) {
    return {
      ok: false,
      error: `${label} file content does not match an allowed PDF, JPEG, or PNG`,
    };
  }
  const extension =
    mimeType === "application/pdf"
      ? "pdf"
      : mimeType === "image/jpeg"
        ? "jpg"
        : "png";
  const fileName =
    value.name
      .replace(/\.[^.]*$/, "")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/^\.+/, "")
      .replace(/\.+$/, "")
      .slice(0, 255 - extension.length - 1) || "merchant-document";

  return {
    ok: true,
    document: { bytes, fileName: `${fileName}.${extension}`, mimeType },
  };
}

export async function GET() {
  try {
    const user = await requireUserRole(["customer", "seller"]);
    const result = await getOwnMerchantKycApplication(user.id);
    return Response.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const authorizationResponse = authorizationErrorResponse(error);
    if (authorizationResponse) return authorizationResponse;
    return apiErrorResponse(
      error,
      "Failed to read merchant application",
      "Merchant application could not be loaded",
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUserRole(["customer", "seller"]);
    const limit = await checkMerchantKycSubmitLimit(user.id);
    if (!limit.allowed) return rateLimitResponse(limit, "merchant KYC submission");

    const formResult = await readBoundedFormData(request);
    if (!formResult.ok) {
      return Response.json(
        { error: formResult.error },
        { status: formResult.status },
      );
    }
    const { form } = formResult;
    const input = merchantKycSubmissionSchema.safeParse({
      ownerFullName: form.get("ownerFullName"),
      businessName: form.get("businessName"),
      businessAddress: form.get("businessAddress"),
      taxId: form.get("taxId") ?? undefined,
    });
    if (!input.success) {
      return Response.json(
        { error: "Business name, address, or TIN is invalid" },
        { status: 400 },
      );
    }

    const registration = await readDocument(
      form.get("registrationDocument"),
      "Business registration",
    );
    if (!registration.ok) {
      return Response.json({ error: registration.error }, { status: 400 });
    }
    const identity = await readDocument(
      form.get("identityDocument"),
      "Owner identity",
    );
    if (!identity.ok) {
      return Response.json({ error: identity.error }, { status: 400 });
    }

    const result = await submitMerchantKyc(
      user.id,
      input.data,
      registration.document,
      identity.document,
    );
    return Response.json(result, {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof MerchantKycAlreadyExistsError) {
      return Response.json(
        { error: "An application for this account already exists" },
        { status: 409 },
      );
    }
    const authorizationResponse = authorizationErrorResponse(error);
    if (authorizationResponse) return authorizationResponse;
    return apiErrorResponse(
      error,
      "Failed to submit merchant application",
      "Merchant application could not be submitted",
    );
  }
}
