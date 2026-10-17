/**
 * Constantes comuns às etapas da jornada de /mercado (antes dentro de JourneySteps.tsx).
 */
import type React from "react";
import { TrendingUp, Target, Scale, Crown, Rocket, Activity, Zap, BookOpen, Shield, CalendarCheck, ArrowUpRight, Sprout, Gauge, AlertTriangle, Banknote, Sparkles } from "lucide-react";

export const ICON_MAP: Record<string, React.ElementType> = {
  Scale, Crown, Rocket, Activity, TrendingUp, AlertTriangle, Shield,
  CalendarCheck, ArrowUpRight, Sprout, Gauge, Zap, Banknote, Sparkles,
  DollarSign: Banknote, Target, BookOpen,
};

export const stagger = (i: number, base = 0) => ({ delay: base + i * 0.06 });
