interface ChartPlaceholderProps {
  title: string;
  description: string;
  bars: number[];
  tone: 'teal' | 'blue';
}

const toneClasses = {
  teal: 'from-teal-500 to-cyan-400',
  blue: 'from-blue-500 to-indigo-400',
};

export const ChartPlaceholder = ({ title, description, bars, tone }: ChartPlaceholderProps) => {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-950">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
          Preview
        </span>
      </div>
      <div className="mt-6 flex h-44 items-end gap-2 rounded-lg bg-gradient-to-b from-slate-50 to-white p-4 ring-1 ring-slate-100">
        {bars.map((height, index) => (
          <div key={`${height}-${index}`} className="flex flex-1 items-end">
            <div
              className={`w-full rounded-t-md bg-gradient-to-t ${toneClasses[tone]} opacity-85 shadow-sm transition-all duration-300 hover:opacity-100`}
              style={{ height: `${height}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
