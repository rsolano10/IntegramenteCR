export function Pagination({
  page,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
}: {
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}) {
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(totalCount, page * pageSize);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-2 border-t border-[#efeada]">
      <p className="m-0 text-[13px] text-tinta-tenue">
        {totalCount === 0 ? "Sin resultados" : `Mostrando ${from}–${to} de ${totalCount}`}
      </p>
      <div className="flex items-center gap-3">
        {onPageSizeChange && (
          <label className="flex items-center gap-1.5 text-[13px] text-tinta-tenue">
            Por página
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="min-h-8 px-2 rounded-lg border border-[#ddd7be] bg-white font-sans text-[13px] text-tinta"
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="min-h-8 px-3 rounded-lg border border-[#ddd7be] bg-white font-sans text-[13px] font-semibold text-tinta disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            ‹ Anterior
          </button>
          <span className="text-[13px] text-tinta-tenue px-1">
            Página {page} de {pageCount}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= pageCount}
            className="min-h-8 px-3 rounded-lg border border-[#ddd7be] bg-white font-sans text-[13px] font-semibold text-tinta disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Siguiente ›
          </button>
        </div>
      </div>
    </div>
  );
}
