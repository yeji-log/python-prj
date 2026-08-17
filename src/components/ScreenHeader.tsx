import Link from "next/link";

export function ScreenHeader({
  title,
  subtitle,
  backHref,
  backLabel,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="mb-6">
      {backHref && (
        <Link
          href={backHref}
          className="text-sm text-slate-500 hover:text-slate-700 mb-2 inline-block"
        >
          ◂ {backLabel ?? "이전으로"}
        </Link>
      )}
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
}
