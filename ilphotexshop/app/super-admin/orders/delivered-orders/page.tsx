import StatusOrdersPage from "@/components/super-admin/status-orders-page";
export default function Page({ searchParams }: { searchParams: Promise<{ q?: string | string[]; page?: string | string[] }> }) {
  return <StatusOrdersPage status="delivered" title="Delivered Orders" searchParams={searchParams} />;
}
