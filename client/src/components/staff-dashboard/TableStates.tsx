export const TableSkeleton = ({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) => {
  return (
    <tbody className="divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex}>
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <td key={columnIndex} className="px-5 py-4">
              <div className="h-4 w-full max-w-32 animate-pulse rounded bg-slate-100" />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
};

export const EmptyState = ({ title, description }: { title: string; description: string }) => {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-50 ring-1 ring-slate-200">
        <svg className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.7}
            d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4m16 0h-4.5a2 2 0 00-1.6.8l-.8 1.1a2 2 0 01-1.6.8h-1a2 2 0 01-1.6-.8l-.8-1.1A2 2 0 006 13H4"
          />
        </svg>
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-800">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
    </div>
  );
};

export const ErrorBanner = ({ message }: { message: string }) => {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {message}
    </div>
  );
};
