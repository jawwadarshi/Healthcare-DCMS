import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  helper: string;
  icon: ReactNode;
  accent: string;
  isLoading?: boolean;
}

export const StatCard = ({ title, value, helper, icon, accent, isLoading = false }: StatCardProps) => {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className={`absolute inset-x-0 top-0 h-1 ${accent}`} />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          {isLoading ? (
            <div className="mt-3 h-9 w-28 animate-pulse rounded-md bg-slate-200" />
          ) : (
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
          )}
        </div>
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-700 ring-1 ring-slate-200 transition-colors group-hover:bg-white">
          {icon}
        </div>
      </div>
      <p className="mt-4 text-sm text-slate-500">{helper}</p>
    </div>
  );
};
