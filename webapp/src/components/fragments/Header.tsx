interface HeaderProps {
  title: string;
  count?: number;
  countLabel?: string;
}

export const Header = ({ title, count, countLabel = "perfiles" }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between bg-background/80 px-6 py-6 backdrop-blur-md">
      {/* Título dinámico */}
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        {title}
      </h1>

      {/* Badge de conteo opcional */}
      {count !== undefined && (
        <div className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground shadow-sm border border-border/50 transition-all hover:scale-105">
          {count} {countLabel}
        </div>
      )}
    </header>
  );
}