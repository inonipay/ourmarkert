import {
  createSellerProduct,
  createSellerProductWithImage,
  getManagedProducts,
} from "@/lib/data-access/products";
import { requireUserRole } from "@/lib/authorization";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { parseJsonRequest } from "@/lib/http/parse-json-request";
import {
  getProductFormFields,
  readProductFormData,
  readProductImageUpload,
} from "@/lib/http/product-image-upload";
import { rateLimitResponse } from "@/lib/http/rate-limit-response";
import {
  checkProductMutationLimit,
  checkSellerProductReadLimit,
} from "@/lib/rate-limit";
import {
  createProductMetadataSchema,
  createProductSchema,
  listProductsQuerySchema,
} from "@/lib/validation/products";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  try {
    const user = await requireUserRole(["seller", "admin", "super_admin"]);
    const query = listProductsQuerySchema.safeParse(
      Object.fromEntries(requestUrl.searchParams.entries()),
    );
    if (!query.success) {
      return Response.json(
        { error: "Invalid product query", details: query.error.flatten() },
        { status: 400 },
      );
    }

    const limit = await checkSellerProductReadLimit(user.id);
    if (!limit.allowed) {
      return rateLimitResponse(limit, "seller product");
    }

    const result = await getManagedProducts(user, query.data);
    return Response.json(result, {
      headers: {
        "Cache-Control": "no-store",
        "X-RateLimit-Remaining": String(limit.remaining),
      },
    });
  } catch (error) {
    return apiErrorResponse(
      error,
      "Failed to load seller products",
      "Seller products are temporarily unavailable",
    );
  }
}

export async function POST(request: Request) {
  try {
    const seller = await requireUserRole("seller");
    const limit = await checkProductMutationLimit(seller.id);
    if (!limit.allowed) {
      return rateLimitResponse(limit, "product write");
    }

    if (
      request.headers
        .get("content-type")
        ?.toLowerCase()
        .startsWith("multipart/form-data;")
    ) {
      const formResult = await readProductFormData(request);
      if (!formResult.ok) {
        return Response.json(
          { error: formResult.error },
          { status: formResult.status },
        );
      }

      const fields = getProductFormFields(formResult.form);
      if (fields.imageSource === "upload") {
        const metadata = createProductMetadataSchema.safeParse(fields.metadata);
        if (!metadata.success) {
          return Response.json(
            { error: "Invalid product details", details: metadata.error.flatten() },
            { status: 400 },
          );
        }
        const image = await readProductImageUpload(
          formResult.form.get("imageFile"),
          true,
        );
        if (!image.ok) {
          return Response.json({ error: image.error }, { status: 400 });
        }
        const product = await createSellerProductWithImage(
          seller,
          metadata.data,
          image.image,
        );
        return Response.json(product, {
          status: 201,
          headers: { "Cache-Control": "no-store" },
        });
      }
      if (fields.imageSource !== "url") {
        return Response.json({ error: "Choose an image source" }, { status: 400 });
      }

      const body = createProductSchema.safeParse({
        ...fields.metadata,
        image: fields.image,
      });
      if (!body.success) {
        return Response.json(
          { error: "Invalid product details", details: body.error.flatten() },
          { status: 400 },
        );
      }
      const product = await createSellerProduct(seller, body.data);
      return Response.json(product, {
        status: 201,
        headers: { "Cache-Control": "no-store" },
      });
    }

    const body = await parseJsonRequest(request, createProductSchema);
    if (!body.success) return body.response;

    const product = await createSellerProduct(seller, body.data);
    return Response.json(product, {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return apiErrorResponse(
      error,
      "Failed to create seller product",
      "Product could not be created",
    );
  }
}
