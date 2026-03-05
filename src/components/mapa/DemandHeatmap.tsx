import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HeatPoint } from "@/data/mapaBairrosData";

interface DemandHeatmapProps {
  heatPoints: HeatPoint[];
  visible: boolean;
}

function heatColor(score: number): string {
  if (score >= 85) return "34, 197, 94";      // green
  if (score >= 65) return "245, 158, 11";      // amber
  return "156, 163, 175";                       // gray
}

function heatOpacity(score: number): number {
  return 0.15 + (score / 100) * 0.35;
}

function heatSize(score: number): number {
  return 40 + (score / 100) * 50;
}

export default function DemandHeatmap({ heatPoints, visible }: DemandHeatmapProps) {
  const [hovered, setHovered] = useState<HeatPoint | null>(null);

  return (
    <AnimatePresence>
      {visible && heatPoints.map((hp, i) => {
        const rgb = heatColor(hp.demandScore);
        const size = heatSize(hp.demandScore);
        return (
          <motion.div
            key={hp.id}
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.3 }}
            transition={{ duration: 0.4, delay: i * 0.03 }}
            className="absolute z-[5]"
            style={{
              left: `${hp.coordinates.x}%`,
              top: `${hp.coordinates.y}%`,
              transform: "translate(-50%, -50%)",
            }}
            onMouseEnter={() => setHovered(hp)}
            onMouseLeave={() => setHovered(null)}
          >
            {/* Glow */}
            <div
              className="rounded-full pointer-events-none"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                background: `radial-gradient(circle, rgba(${rgb}, ${heatOpacity(hp.demandScore)}) 0%, rgba(${rgb}, 0.02) 70%, transparent 100%)`,
                filter: hp.demandScore >= 85 ? "blur(4px)" : "blur(6px)",
              }}
            />
            {/* Center dot */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full cursor-pointer"
              style={{ backgroundColor: `rgba(${rgb}, 0.8)` }}
            />

            {/* Tooltip */}
            {hovered?.id === hp.id && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-card border border-border shadow-lg rounded-lg px-3 py-2 whitespace-nowrap z-50 pointer-events-none"
              >
                <p className="text-[10px] font-bold text-foreground">{hp.areaName}</p>
                <div className="flex gap-3 mt-1 text-[9px] text-muted-foreground">
                  <span>Demanda: <strong className="text-foreground">{hp.demandScore}</strong></span>
                  <span>Ocup: <strong className="text-foreground">{hp.occupancyEstimate}%</strong></span>
                </div>
                <p className="text-[9px] text-muted-foreground mt-0.5">
                  ADR: <strong className="text-foreground">R${hp.adrEstimate}</strong>
                </p>
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}
