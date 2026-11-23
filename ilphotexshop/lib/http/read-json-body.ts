export type JsonBodyResult =
  | { success: true; value: unknown }
  | { success: false; reason: "invalid" | "too-large" };

export async function readJsonBody(
  request: Request,
  maxBytes: number,
): Promise<JsonBodyResult> {
  const declaredLength = request.headers.get("content-length");
  if (declaredLength) {
    const length = Number(declaredLength);
    if (!Number.isSafeInteger(length) || length < 0) {
      return { success: false, reason: "invalid" };
    }
    if (length > maxBytes) {
      return { success: false, reason: "too-large" };
    }
  }

  const reader = request.body?.getReader();
  if (!reader) {
    return { success: false, reason: "invalid" };
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        return { success: false, reason: "too-large" };
      }

      chunks.push(value);
    }

    const bytes = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }

    try {
      return {
        success: true,
        value: JSON.parse(new TextDecoder().decode(bytes)),
      };
    } catch (error) {
      if (error instanceof SyntaxError) {
        return { success: false, reason: "invalid" };
      }
      throw error;
    }
  } finally {
    reader.releaseLock();
  }
}
