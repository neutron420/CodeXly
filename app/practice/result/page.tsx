import Link from "next/link";
import { Header1 } from "@/components/ui/header";
import { ArrowLeft, Gauge, Target, Timer } from "lucide-react";

type ResultPageProps = {
  searchParams: Promise<{
    wpm?: string;
    accuracy?: string;
    duration?: string;
    language?: string;
    chars?: string;
  }>;
};

const toNumber = (value: string | undefined, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export default async function PracticeResultPage({ searchParams }: ResultPageProps) {
  const params = await searchParams;
  const wpm = toNumber(params.wpm, 0);
  const accuracy = toNumber(params.accuracy, 0);
  const duration = toNumber(params.duration, 0);
  const language = params.language ?? "N/A";
  const chars = params.chars ?? "0/0";

  // Build a tiny sparkline path based on the final wpm to give a quick visual.
  const samplePoints = [0.4, 0.6, 0.72, 0.85, 0.92, 1, 0.9, 0.95].map(
    (p, idx) => {
      const x = (idx / 7) * 100;
      const y = 100 - Math.max(0, Math.min(1, p)) * 80; // keep some padding
      return `${x},${y}`;
    },
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header1 />

      <main className="container mx-auto px-4 sm:px-6 pb-8 sm:pb-10 pt-16 sm:pt-20 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Practice summary
            </p>
            <h1 className="text-xl sm:text-2xl font-semibold">Session results</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Language: {language} • Duration: {duration}s • Characters: {chars}
            </p>
          </div>
          <Link
            href="/practice"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm hover:bg-accent hover:text-accent-foreground transition"
          >
            <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Back to practice</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-xl sm:rounded-2xl border border-border/70 bg-card/95 backdrop-blur px-3 sm:px-4 py-3 sm:py-4 shadow-[0_14px_32px_rgba(0,0,0,0.28)]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-3 sm:mb-4">
              <h2 className="text-xs sm:text-sm font-semibold text-muted-foreground">
                Performance graph
              </h2>
              <span className="text-[10px] sm:text-xs text-muted-foreground">
                Performance visualization
              </span>
            </div>
            <div className="h-[180px] sm:h-[220px] rounded-lg sm:rounded-xl border border-border/60 bg-gradient-to-br from-background/95 to-background/80 px-2 sm:px-3 py-2 sm:py-3 relative overflow-hidden">
              {/* Background gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-green-500/5 via-transparent to-transparent pointer-events-none" />
              
              <svg viewBox="0 0 100 100" className="h-full w-full relative z-10" preserveAspectRatio="none">
                {/* Grid background */}
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                    <stop offset="50%" stopColor="#22c55e" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity="1" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>

                {/* Horizontal grid lines with better styling */}
                {[20, 40, 60, 80].map((y) => (
                  <line
                    key={y}
                    x1="0"
                    y1={y}
                    x2="100"
                    y2={y}
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="0.5"
                    strokeDasharray="1 3"
                  />
                ))}

                {/* Area fill under the line for better visual */}
                <polygon
                  points={`0,100 ${samplePoints.map(p => p.split(',')[0] + ',' + p.split(',')[1]).join(' ')} 100,100`}
                  fill="url(#lineGradient)"
                  fillOpacity="0.15"
                />

                {/* Main performance line with gradient */}
                <polyline
                  fill="none"
                  stroke="url(#lineGradient)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={samplePoints.join(" ")}
                  filter="url(#glow)"
                  className="drop-shadow-[0_2px_8px_rgba(34,197,94,0.4)]"
                />

                {/* Data points */}
                {samplePoints.map((point, idx) => {
                  const [x, y] = point.split(',').map(Number);
                  return (
                    <circle
                      key={idx}
                      cx={x}
                      cy={y}
                      r={idx === samplePoints.length - 1 ? "1.8" : "1.2"}
                      fill={idx === samplePoints.length - 1 ? "#22c55e" : "rgba(34,197,94,0.6)"}
                      className={idx === samplePoints.length - 1 ? "drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]" : ""}
                    />
                  );
                })}

                {/* Current session highlight */}
                <circle
                  cx="100"
                  cy={100 - 0.9 * 80}
                  r="3.5"
                  fill="rgba(34,197,94,0.2)"
                />
                <circle
                  cx="100"
                  cy={100 - 0.9 * 80}
                  r="2.2"
                  fill="#22c55e"
                  className="drop-shadow-[0_0_12px_rgba(34,197,94,1)]"
                />
              </svg>
              
              {/* Performance indicator text overlay */}
              <div className="absolute bottom-2 right-3 text-[9px] sm:text-[10px] text-muted-foreground/70 font-medium">
                WPM: {wpm.toFixed(1)}
              </div>
            </div>
          </div>

          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3 lg:grid-cols-1">
            <ResultCard
              icon={<Gauge className="h-4 w-4 sm:h-5 sm:w-5" />}
              label="WPM"
              value={`${wpm.toFixed(1)}`}
              hint="Words per minute"
            />
            <ResultCard
              icon={<Target className="h-4 w-4 sm:h-5 sm:w-5" />}
              label="Accuracy"
              value={`${accuracy.toFixed(1)}%`}
              hint="Correctness of typed chars"
            />
            <ResultCard
              icon={<Timer className="h-4 w-4 sm:h-5 sm:w-5" />}
              label="Time"
              value={`${duration}s`}
              hint="Session duration"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function ResultCard(props: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg sm:rounded-xl border border-border/70 bg-card/95 backdrop-blur p-3 sm:p-4 space-y-1.5 sm:space-y-2 shadow-[0_10px_24px_rgba(0,0,0,0.2)]">
      <div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm">
        {props.icon}
        <span>{props.label}</span>
      </div>
      <div className="text-xl sm:text-2xl font-semibold text-foreground">{props.value}</div>
      {props.hint && <p className="text-[10px] sm:text-xs text-muted-foreground leading-snug">{props.hint}</p>}
    </div>
  );
}

