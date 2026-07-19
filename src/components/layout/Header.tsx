interface HeaderProps {
  dashboardLabel: string;
  pageTitle: string;
}

export default function Header({
  dashboardLabel,
  pageTitle,
}: HeaderProps) {
  return (
    <header className="h-24 bg-[#fdf8f0] border-b border-black/10 flex items-center px-8">
      <div className="flex flex-col">
        <p className="text-sm text-black/70">
          {dashboardLabel}
        </p>

        <h2 className="text-3xl font-bold text-black">
          {pageTitle}
        </h2>
      </div>
    </header>
  );
}