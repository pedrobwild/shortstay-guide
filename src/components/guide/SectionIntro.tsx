import { type LucideIcon } from "lucide-react";

interface SectionIntroProps {
  icon: LucideIcon;
  text: string;
}

export default function SectionIntro({ icon: Icon, text }: SectionIntroProps) {
  return (
    <div className="py-6 text-center">
      <Icon size={28} className="mx-auto mb-2 text-accent-text/40" aria-hidden="true" />
      <p className="text-sm text-muted-foreground font-body">{text}</p>
    </div>
  );
}
