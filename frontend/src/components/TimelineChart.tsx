import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceDot,
} from "recharts";
import type { AnomalySpike, TimelinePoint } from "../services/api";

interface TimelineChartProps {
  timeline: TimelinePoint[];
  anomalies: AnomalySpike[];
}

export function TimelineChart({ timeline, anomalies }: TimelineChartProps) {
  const formatted = timeline.map((p) => ({
    ...p,
    shortTime: p.minute.slice(11), // "HH:MM"
  }));

  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium text-zinc-200">
            Evolución de errores por minuto
          </h2>
          <p className="text-xs text-zinc-500">
            Los puntos rojos indican picos anómalos detectados por Z-score (&ge; 2.5)
          </p>
        </div>
        {anomalies.length > 0 && (
          <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400">
            {anomalies.length} {anomalies.length === 1 ? "anomalía" : "anomalías"}
          </span>
        )}
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formatted} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="errorGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis
              dataKey="shortTime"
              stroke="#71717a"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#71717a"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                borderColor: "#27272a",
                borderRadius: "0.5rem",
                fontSize: "12px",
              }}
              labelStyle={{ color: "#a1a1aa" }}
            />
            <Area
              type="monotone"
              dataKey="errors"
              name="Errores"
              stroke="#ef4444"
              strokeWidth={2}
              fill="url(#errorGrad)"
            />
            {anomalies.map((a) => (
              <ReferenceDot
                key={a.minute}
                x={a.minute.slice(11)}
                y={a.error_count}
                r={5}
                fill="#ef4444"
                stroke="#09090b"
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}