import { formatStatusLabel } from './statusUtils';

const statusClasses: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  confirmed: 'bg-blue-50 text-blue-700 ring-blue-200',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  cancelled: 'bg-rose-50 text-rose-700 ring-rose-200',
  no_show: 'bg-slate-100 text-slate-700 ring-slate-200',
};

export const StatusBadge = ({ status }: { status: string }) => {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
        statusClasses[status] ?? 'bg-slate-50 text-slate-700 ring-slate-200'
      }`}
    >
      {formatStatusLabel(status)}
    </span>
  );
};
