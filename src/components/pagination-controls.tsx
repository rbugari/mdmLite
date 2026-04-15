import Link from "next/link";

type PaginationControlsProps = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  pathname: string;
  query: Record<string, string | undefined>;
};

function buildHref(pathname: string, query: Record<string, string | undefined>, page: number, pageSize: number) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value && value.trim()) {
      params.set(key, value);
    }
  });

  params.set("page", String(page));
  params.set("pageSize", String(pageSize));

  return `${pathname}?${params.toString()}`;
}

export function PaginationControls({ page, pageSize, total, totalPages, pathname, query }: PaginationControlsProps) {
  const previousPage = Math.max(1, page - 1);
  const nextPage = Math.min(totalPages, page + 1);

  return (
    <div className="form-actions" style={{ marginTop: 14 }}>
      <span className="metric-pill">
        total={total} page={page}/{totalPages} size={pageSize}
      </span>
      <Link
        href={buildHref(pathname, query, previousPage, pageSize)}
        className="hero-link"
        aria-disabled={page <= 1}
      >
        Previous
      </Link>
      <Link
        href={buildHref(pathname, query, nextPage, pageSize)}
        className="hero-link"
        aria-disabled={page >= totalPages}
      >
        Next
      </Link>
    </div>
  );
}
