import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const ABAS = [
  { to: "/admin/bairros", label: "Bairros" },
  { to: "/admin/simulacoes", label: "Simulações" },
  { to: "/admin/leads", label: "Leads" },
];

export default function AdminTabs() {
  return (
    <nav aria-label="Áreas do admin" className="flex flex-wrap gap-2 border-b border-border pb-3">
      {ABAS.map((a) => (
        <NavLink
          key={a.to}
          to={a.to}
          className={({ isActive }) =>
            cn(
              "min-h-[44px] inline-flex items-center px-4 rounded-md text-sm font-medium transition-colors",
              isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
            )
          }
        >
          {a.label}
        </NavLink>
      ))}
    </nav>
  );
}
