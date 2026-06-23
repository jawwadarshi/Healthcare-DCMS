interface SectionTitleProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
}

export const SectionTitle = ({
  title,
  subtitle,
  centered = true,
}: SectionTitleProps) => {
  return (
    <div className={`${centered ? 'text-center' : ''} mb-12`}>
      <h2 className="text-4xl font-bold text-gray-900 mb-4">{title}</h2>
      {subtitle && (
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">{subtitle}</p>
      )}
    </div>
  );
};
