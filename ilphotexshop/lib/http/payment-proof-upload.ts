const maxDocumentBytes = 2 * 1024 * 1024;
const maxFormBytes = maxDocumentBytes + 64 * 1024;

export type PaymentProofDocument = {
  bytes: Uint8Array;
  fileName: string;
  mimeType: string;
};

export type PaymentProofFormResult =
  | { ok: true; form: FormData }
  | { ok: false; status: 400 | 413; error: string };

export type PaymentProofDocumentResult =
  | { ok: true; document: PaymentProofDocument }
  | { ok: false; error: string };

export async function readPaymentProofForm(
  request: Request,
): Promise<PaymentProofFormResult> {
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const bytes = Number(contentLength);
    if (!Number.isSafeInteger(bytes) || bytes < 0) {
      return { ok: false, status: 400, error: "Invalid request size" };
    }
    if (bytes > maxFormBytes) {
      return { ok: false, status: 413, error: "Payment proof file is too large" };
    }
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
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxFormBytes) {
        await reader.cancel();
        return { ok: false, status: 413, error: "Payment proof file is too large" };
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
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

function detectMimeType(bytes: Uint8Array) {
  if (
    bytes.length >= 5 &&
    String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-"
  ) {
    return "application/pdf";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
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

export async function readPaymentProofDocument(
  value: FormDataEntryValue | null,
): Promise<PaymentProofDocumentResult> {
  if (!(value instanceof File)) {
    return { ok: false, error: "A payment receipt is required" };
  }
  if (!value.size || value.size > maxDocumentBytes) {
    return {
      ok: false,
      error: "Payment receipt must be smaller than or equal to 2 MB",
    };
  }

  const bytes = new Uint8Array(await value.arrayBuffer());
  const mimeType = detectMimeType(bytes);
  if (
    !mimeType ||
    (value.type && !["application/pdf", "image/jpeg", "image/png"].includes(value.type)) ||
    (value.type && value.type !== mimeType)
  ) {
    return {
      ok: false,
      error: "Use a valid PDF, JPEG, or PNG receipt",
    };
  }

  const extension =
    mimeType === "application/pdf"
      ? "pdf"
      : mimeType === "image/jpeg"
        ? "jpg"
        : "png";
  const baseName =
    value.name
      .replace(/\.[^.]*$/, "")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/^\.+/, "")
      .replace(/\.+$/, "")
      .slice(0, 255 - extension.length - 1) || "payment-receipt";

  return {
    ok: true,
    document: {
      bytes,
      fileName: `${baseName}.${extension}`,
      mimeType,
    },
  };
}
