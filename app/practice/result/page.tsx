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

      <main className="container mx-auto px-4 pb-10 pt-20 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Practice summary
            </p>
            <h1 className="text-2xl font-semibold">Session results</h1>
            <p className="text-sm text-muted-foreground">
              Language: {language} • Duration: {duration}s • Characters: {chars}
            </p>
          </div>
          <Link
            href="/practice"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to practice
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-border/70 bg-card/95 backdrop-blur px-4 py-4 shadow-[0_14px_32px_rgba(0,0,0,0.28)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-muted-foreground">
                Performance graph
              </h2>
              <span className="text-xs text-muted-foreground">
                WPM trend (synthetic preview)
              </span>
            </div>
            <div className="h-[220px] rounded-xl border border-border/60 bg-background/60 px-3 py-3">
              <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="none">
                {/* soft background */}
                <rect
                  x="0"
                  y="0"
                  width="100"
                  height="100"
                  fill="#111827"
                  fillOpacity="0.9"
                />

                {/* horizontal grid lines */}
                <polyline
                  fill="none"
                  stroke="rgba(255,255,255,0.18)"
                  strokeDasharray="2 4"
                  strokeWidth="0.6"
                  points="0,80 100,80"
                />
                <polyline
                  fill="none"
                  stroke="rgba(255,255,255,0.18)"
                  strokeDasharray="2 4"
                  strokeWidth="0.6"
                  points="0,60 100,60"
                />
                <polyline
                  fill="none"
                  stroke="rgba(255,255,255,0.18)"
                  strokeDasharray="2 4"
                  strokeWidth="0.6"
                  points="0,40 100,40"
                />

                {/* main spark line */}
                <polyline
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={samplePoints.join(" ")}
                  className="drop-shadow-[0_6px_14px_rgba(0,0,0,0.8)]"
                />

                {/* highlight last point */}
                <circle
                  cx="100"
                  cy={100 - 0.9 * 80}
                  r="4"
                  fill="rgba(34,197,94,0.18)"
                />
                <circle
                  cx="100"
                  cy={100 - 0.9 * 80}
                  r="2.6"
                  fill="#22c55e"
                  className="drop-shadow-[0_0_10px_rgba(34,197,94,0.95)]"
                />
              </svg>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <ResultCard
              icon={<Gauge className="h-5 w-5" />}
              label="WPM"
              value={`${wpm.toFixed(1)}`}
              hint="Words per minute"
            />
            <ResultCard
              icon={<Target className="h-5 w-5" />}
              label="Accuracy"
              value={`${accuracy.toFixed(1)}%`}
              hint="Correctness of typed chars"
            />
            <ResultCard
              icon={<Timer className="h-5 w-5" />}
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
    <div className="rounded-xl border border-border/70 bg-card/95 backdrop-blur p-4 space-y-2 shadow-[0_10px_24px_rgba(0,0,0,0.2)]">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        {props.icon}
        <span>{props.label}</span>
      </div>
      <div className="text-2xl font-semibold text-foreground">{props.value}</div>
      {props.hint && <p className="text-xs text-muted-foreground leading-snug">{props.hint}</p>}
    </div>
  );
}

