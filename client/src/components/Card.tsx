import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
}

export const Card = ({
  children,
  header,
  footer,
  className,
  ...props
}: CardProps) => {
  return (
    <div
      className={`
        bg-white rounded-lg shadow-md border border-gray-200
        hover:shadow-lg transition-shadow duration-200
        ${className || ''}
      `}
      {...props}
    >
      {header && (
        <div className="px-6 py-4 border-b border-gray-200">
          {header}
        </div>
      )}

      <div className="px-6 py-4">
        {children}
      </div>

      {footer && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          {footer}
        </div>
      )}
    </div>
  );
};
