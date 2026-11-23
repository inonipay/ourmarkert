export async function parseSecurityPageParams(
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>,
) {
  const params = await searchParams;
  const query = (Array.isArray(params.q) ? params.q[0] : params.q ?? "")
    .trim()
    .slice(0, 100);
  const value = Array.isArray(params.page) ? params.page[0] : params.page;
  const parsedPage = Number(value ?? "1");
  return {
    query,
    page: Number.isSafeInteger(parsedPage) && parsedPage > 0
      ? Math.min(parsedPage, 500)
      : 1,
  };
}
