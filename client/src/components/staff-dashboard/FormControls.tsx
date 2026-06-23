import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';

const controlClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

export const Field = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
};

export const TextInput = (props: InputHTMLAttributes<HTMLInputElement>) => {
  return <input className={controlClass} {...props} />;
};

export const SelectInput = (props: SelectHTMLAttributes<HTMLSelectElement>) => {
  return <select className={controlClass} {...props} />;
};

export const TextAreaInput = (props: TextareaHTMLAttributes<HTMLTextAreaElement>) => {
  return <textarea className={`${controlClass} min-h-24 resize-y`} {...props} />;
};
