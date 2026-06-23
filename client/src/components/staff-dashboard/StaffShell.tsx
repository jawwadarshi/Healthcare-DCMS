import type { ReactNode } from 'react';

interface StaffPageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}

interface StaffPanelProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}

export const StaffPageHeader = ({ eyebrow, title, description, action }: StaffPageHeaderProps) => {
  return (
    <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-white via-cyan-50 to-blue-50 p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-teal-700 ring-1 ring-teal-100">
            {eyebrow}
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
        </div>
        {action}
      </div>
    </div>
  );
};

export const StaffPanel = ({ title, description, action, children }: StaffPanelProps) => {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-950">{title}</h2>
          {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
};
