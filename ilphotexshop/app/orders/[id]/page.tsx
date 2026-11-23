import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Package } from "lucide-react";
import CustomerOrderCancelAction from "@/components/orders/cancel-order-action";
import CustomerPaymentProofForm from "@/components/orders/payment-proof-form";
import SuperAdminRecordActions from "@/components/super-admin/record-actions";
import { requireCustomerPageUser } from "@/lib/authorization";
import { getCustomerOrder } from "@/lib/data-access/orders";
import { getActivePaymentAccounts } from "@/lib/data-access/order-payment-proofs";
import { orderIdSchema } from "@/lib/validation/orders";

export const metadata: Metadata = {
  title: "Order details | ILPhotoX Shop",
  robots: { index: false, follow: false },
};

const numberFormat = new Intl.NumberFormat("en-RW");
const dateFormat = new Intl.DateTimeFormat("en-RW", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
});

export default function CustomerOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<div className="customer-orders-loading">Loading order details…</div>}>
      <CustomerOrderDetailContent params={params} />
    </Suspense>
  );
}

async function CustomerOrderDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const parsedId = orderIdSchema.safeParse(id);
  if (!parsedId.success) notFound();

  const customer = await requireCustomerPageUser(`/orders/${encodeURIComponent(id)}`);
  const order = await getCustomerOrder(customer.id, parsedId.data);
  if (!order) notFound();
  const hasUnresolvedPaymentProof = order.paymentProofs.some(
    (proof) => proof.status === "pending" || proof.status === "approved",
  );
  const canSubmitProof =
    order.status === "pending" && !hasUnresolvedPaymentProof;
  const paymentAccounts = canSubmitProof
    ? await getActivePaymentAccounts()
    : [];

  const title = `Order ${order.id.slice(-8).toUpperCase()}`;
  const fields = [
    { label: "Order ID", value: order.id },
    { label: "Status", value: order.status },
    { label: "Placed", value: dateFormat.format(order.createdAt) },
    { label: "Delivery recipient", value: order.deliveryName },
    { label: "Delivery phone", value: order.deliveryPhone },
    { label: "Delivery address", value: order.deliveryAddress },
    {
      label: "Items subtotal",
      value: `${numberFormat.format(order.subtotal)} ${order.currency}`,
    },
    ...order.items.map((item, index) => ({
      label: `Item ${index + 1}`,
      value: `${item.productName} · ${item.quantity} × ${numberFormat.format(item.unitPrice)} ${order.currency}`,
    })),
  ];

  return (
    <div className="customer-orders-page">
      <div className="customer-orders-heading">
        <div>
          <span className="customer-orders-breadcrumb">
            <Link href="/orders">My orders</Link> / Order details
          </span>
          <h1>{title}</h1>
          <p>Placed {dateFormat.format(order.createdAt)} UTC</p>
        </div>
        <span className={`customer-order-status is-${order.status}`}>
          {order.status}
        </span>
      </div>

      <article className="customer-order-record">
        <header className="customer-order-brand">
          <Image
            alt=""
            height={44}
            src="/ilphotox-shop-logo.png"
            width={44}
          />
          <div>
            <strong>ILPhotoX Shop</strong>
            <span>Customer · Order record</span>
          </div>
        </header>

        <section className="customer-order-items">
          <div className="customer-order-section-heading">
            <div>
              <h2><Package aria-hidden="true" size={18} /> Items</h2>
              <p>{order.items.reduce((sum, item) => sum + item.quantity, 0)} units</p>
            </div>
          </div>
          <div className="customer-orders-table-wrap">
            <table className="customer-orders-table">
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col">Seller</th>
                  <th scope="col">Quantity</th>
                  <th scope="col">Unit price</th>
                  <th scope="col">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.productName}</strong></td>
                    <td>{item.sellerName}</td>
                    <td>{numberFormat.format(item.quantity)}</td>
                    <td>{numberFormat.format(item.unitPrice)} {order.currency}</td>
                    <td>{numberFormat.format(item.lineTotal)} {order.currency}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th colSpan={4} scope="row">Items subtotal</th>
                  <td>{numberFormat.format(order.subtotal)} {order.currency}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <section className="customer-order-delivery">
          <h2>Delivery details</h2>
          <dl>
            <div><dt>Recipient</dt><dd>{order.deliveryName}</dd></div>
            <div><dt>Phone</dt><dd>{order.deliveryPhone}</dd></div>
            <div><dt>Address</dt><dd>{order.deliveryAddress}</dd></div>
          </dl>
        </section>

        <div className="customer-order-payment-note">
          Payment proof review does not automatically confirm the order. The order
          remains pending until an administrator confirms it.
        </div>

        <section className="customer-order-payment-history">
          <div className="customer-order-section-heading">
            <div>
              <h2>Payment receipt status</h2>
              <p>
                {order.paymentProofs.length
                  ? `${order.paymentProofs.length} receipt submission${order.paymentProofs.length === 1 ? "" : "s"}`
                  : "No receipts submitted"}
              </p>
            </div>
          </div>
          {order.paymentProofs.length ? (
            <ul>
              {order.paymentProofs.map((proof) => (
                <li key={proof.id}>
                  <div>
                    <strong>{proof.method === "bank_transfer" ? "Bank transfer" : "Mobile money"}</strong>
                    <span>
                      {proof.transactionReference} · {numberFormat.format(proof.amount)} {proof.currency}
                    </span>
                    <span>{dateFormat.format(proof.createdAt)} UTC</span>
                    {proof.reviewReason && <span>Review note: {proof.reviewReason}</span>}
                  </div>
                  <span className={`customer-payment-proof-status is-${proof.status}`}>
                    {proof.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        {canSubmitProof && (
          <CustomerPaymentProofForm
            accounts={paymentAccounts}
            orderId={order.id}
          />
        )}

        <section className="customer-order-export">
          <div className="customer-order-section-heading">
            <div>
              <h2>Order record</h2>
              <p>Download or share a PDF of your order details.</p>
            </div>
          </div>
          <SuperAdminRecordActions
            fields={fields}
            recordId={order.id}
            title={title}
          />
        </section>
      </article>

      <div className="customer-order-page-actions">
        <Link className="customer-orders-back" href="/orders">
          <ArrowLeft aria-hidden="true" size={16} /> Back to my orders
        </Link>
        {hasUnresolvedPaymentProof ? (
          <p className="customer-order-cancel-note">
            Cancellation is unavailable while a payment receipt is pending review or approved.
          </p>
        ) : (
          <CustomerOrderCancelAction orderId={order.id} status={order.status} />
        )}
      </div>
    </div>
  );
}
