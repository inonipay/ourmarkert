export const maxProductImageBytes = 5 * 1024 * 1024;
const maxProductFormBytes = maxProductImageBytes + 64 * 1024;

export type UploadedProductImage = {
  imageData: Uint8Array;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
};

export type ProductFormDataResult =
  | { ok: true; form: FormData }
  | { ok: false; status: 400 | 413; error: string };

export type ProductImageUploadResult =
  | { ok: true; image: UploadedProductImage | null }
  | { ok: false; error: string };

function getTextField(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
}

export function getProductFormFields(form: FormData) {
  const previousPrice = getTextField(form, "previousPrice").trim();
  return {
    imageSource: getTextField(form, "imageSource"),
    image: getTextField(form, "image").trim(),
    metadata: {
      name: getTextField(form, "name").trim(),
      nameRw: getTextField(form, "nameRw").trim() || null,
      nameFr: getTextField(form, "nameFr").trim() || null,
      category: getTextField(form, "category"),
      price: Number(getTextField(form, "price")),
      previousPrice: previousPrice ? Number(previousPrice) : null,
      location: getTextField(form, "location").trim(),
      stockQuantity: Number(getTextField(form, "stockQuantity")),
    },
  };
}

export async function readProductFormData(
  request: Request,
): Promise<ProductFormDataResult> {
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const bytes = Number(contentLength);
    if (!Number.isSafeInteger(bytes) || bytes < 0) {
      return { ok: false, status: 400, error: "Invalid request size" };
    }
    if (bytes > maxProductFormBytes) {
      return { ok: false, status: 413, error: "Product image is too large" };
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
      if (totalBytes > maxProductFormBytes) {
        await reader.cancel();
        return { ok: false, status: 413, error: "Product image is too large" };
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

function getImageMimeType(bytes: Uint8Array): UploadedProductImage["mimeType"] | null {
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
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

export function readProductImageUpload(
  value: FormDataEntryValue | null,
  required: true,
): Promise<
  | { ok: true; image: UploadedProductImage }
  | { ok: false; error: string }
>;
export function readProductImageUpload(
  value: FormDataEntryValue | null,
  required: false,
): Promise<ProductImageUploadResult>;
export async function readProductImageUpload(
  value: FormDataEntryValue | null,
  required: boolean,
): Promise<ProductImageUploadResult> {
  if (
    value === null ||
    (value instanceof File && value.size === 0 && value.name === "")
  ) {
    return required
      ? { ok: false, error: "Choose a product image to upload" }
      : { ok: true, image: null };
  }
  if (!(value instanceof File)) {
    return { ok: false, error: "Invalid product image" };
  }
  if (!value.size || value.size > maxProductImageBytes) {
    return {
      ok: false,
      error: "Product image must be smaller than or equal to 5 MB",
    };
  }

  const imageData = new Uint8Array(await value.arrayBuffer());
  const mimeType = getImageMimeType(imageData);
  if (!mimeType || (value.type && value.type !== mimeType)) {
    return {
      ok: false,
      error: "Use a valid JPEG, PNG, or WebP image",
    };
  }

  return { ok: true, image: { imageData, mimeType } };
}
