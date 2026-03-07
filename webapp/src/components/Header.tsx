import { Bell } from "lucide-react"

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b-2 flex justify-between items-center px-6 py-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Match-TFE
      </h1>
      <Bell className="h-6 w-6 text-muted-foreground" />
    </header>
  );
}