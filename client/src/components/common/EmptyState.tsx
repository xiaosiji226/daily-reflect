interface Props {
  icon?: string;
  title: string;
  subtitle?: string;
}

export default function EmptyState({ icon = '📝', title, subtitle }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 gap-3">
      <span className="text-4xl">{icon}</span>
      <span className="text-slate-600 font-medium">{title}</span>
      {subtitle && <span className="text-sm text-slate-400">{subtitle}</span>}
    </div>
  );
}
