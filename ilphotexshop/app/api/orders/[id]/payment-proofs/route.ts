import { requireUserRole } from "@/lib/authorization";
import {
  OrderNotPayableError,
  PaymentMethodUnavailableError,
  PaymentProofConflictError,
  submitOrderPaymentProof,
} from "@/lib/data-access/order-payment-proofs";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import {
  readPaymentProofDocument,
  readPaymentProofForm,
} from "@/lib/http/payment-proof-upload";
import { rateLimitResponse } from "@/lib/http/rate-limit-response";
import { checkPaymentProofSubmitLimit } from "@/lib/rate-limit";
import { orderIdSchema } from "@/lib/validation/orders";
import { paymentProofSubmissionSchema } from "@/lib/validation/payment-proofs";

type PaymentProofRouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  request: Request,
  context: PaymentProofRouteContext,
) {
  try {
    const customer = await requireUserRole("customer");
    const limit = await checkPaymentProofSubmitLimit(customer.id);
    if (!limit.allowed) return rateLimitResponse(limit, "payment proof");

    const { id } = await context.params;
    const parsedId = orderIdSchema.safeParse(id);
    if (!parsedId.success) {
      return Response.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const parsedForm = await readPaymentProofForm(request);
    if (!parsedForm.ok) {
      return Response.json(
        { error: parsedForm.error },
        { status: parsedForm.status },
      );
    }

    const input = paymentProofSubmissionSchema.safeParse({
      method: parsedForm.form.get("method"),
      transactionReference: parsedForm.form.get("transactionReference"),
    });
    if (!input.success) {
      return Response.json(
        { error: input.error.issues[0]?.message ?? "Invalid payment proof details" },
        { status: 400 },
      );
    }

    const parsedDocument = await readPaymentProofDocument(
      parsedForm.form.get("document"),
    );
    if (!parsedDocument.ok) {
      return Response.json({ error: parsedDocument.error }, { status: 400 });
    }

    const proof = await submitOrderPaymentProof(
      customer.id,
      parsedId.data,
      input.data,
      parsedDocument.document,
    );
    if (!proof) return Response.json({ error: "Order not found" }, { status: 404 });

    return Response.json(
      { proof },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof PaymentProofConflictError) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    if (
      error instanceof OrderNotPayableError ||
      error instanceof PaymentMethodUnavailableError
    ) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    return apiErrorResponse(
      error,
      "Failed to submit order payment proof",
      "Payment receipt could not be submitted",
    );
  }
}
