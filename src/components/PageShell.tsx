export function PageShell({
  children,
  wide = false,
}: {
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <main className={`flex-1 w-full ${wide ? "max-w-4xl" : "max-w-2xl"} mx-auto px-4 py-8`}>
      {children}
    </main>
  );
}
