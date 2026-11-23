import { redirect } from "next/navigation";

export default function MerchantVerificationPage() {
  redirect("/super-admin/merchants/pending-applications");
}
