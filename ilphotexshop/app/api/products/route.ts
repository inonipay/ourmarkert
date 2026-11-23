import { getPublishedProducts } from "@/lib/data-access/products";
import { rateLimitResponse } from "@/lib/http/rate-limit-response";
import { checkProductListingLimit, getClientIp } from "@/lib/rate-limit";
import { listProductsQuerySchema } from "@/lib/validation/products";

export async function GET(request: Request) {
  const parsedQuery = listProductsQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams.entries()),
  );

  if (!parsedQuery.success) {
    return Response.json(
      { error: "Invalid product query", details: parsedQuery.error.flatten() },
      { status: 400 },
    );
  }

  const clientIp = getClientIp(
    request.headers.get("x-real-ip"),
    request.headers.get("x-forwarded-for"),
  );

  try {
    const limit = await checkProductListingLimit(clientIp);
    if (!limit.allowed) {
      return rateLimitResponse(limit, "product catalog");
    }

    const result = await getPublishedProducts(parsedQuery.data);
    return Response.json(
      { ...result, limit: parsedQuery.data.limit, offset: parsedQuery.data.offset },
      {
        headers: {
          "Cache-Control": "no-store",
          "X-RateLimit-Remaining": String(limit.remaining),
        },
      },
    );
  } catch (error) {
    console.error("Failed to load marketplace products", error);
    return Response.json(
      { error: "The product catalog is temporarily unavailable" },
      { status: 500 },
    );
  }
}
