export function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto text-sm leading-relaxed font-mono">
      <code>{code}</code>
    </pre>
  );
}
