"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Header1 } from "@/components/ui/header";
import { PracticeSidebar } from "@/components/practice-sidebar";
import { AlertCircle, CheckCircle2, Timer } from "lucide-react";

type LanguageName =
  | "C"
  | "CPP"
  | "JAVA"
  | "JAVASCRIPT"
  | "TYPESCRIPT"
  | "PYTHON"
  | "RUST"
  | "GO";

type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

type PracticeSnippet = {
  id: string | null;
  content: string;
  languageName: LanguageName;
  difficulty: Difficulty;
  topicName: string | null;
  isSample: boolean;
};

// Only TypeScript and Python are premium; others are free to practice.
const PREMIUM_LANGUAGES: LanguageName[] = ["TYPESCRIPT", "PYTHON"];

const SAMPLE_TOPICS: Record<LanguageName, string[]> = {
  JAVASCRIPT: ["array-reduce", "memoization", "async-await", "array-methods"],
  TYPESCRIPT: ["types", "math"],
  PYTHON: ["hashmap", "collections"],
  CPP: ["stl", "strings", "maps", "algorithms"],
  C: ["basics", "recursion", "loops", "pointers"],
  JAVA: ["loops", "streams", "collections", "optional"],
  GO: ["loops", "strings"],
  RUST: ["iterators", "strings"],
};

const LANGUAGES: { value: LanguageName; label: string }[] = [
  { value: "JAVASCRIPT", label: "JavaScript" },
  { value: "C", label: "C" },
  { value: "CPP", label: "C++" },
  { value: "JAVA", label: "Java" },
  { value: "GO", label: "Go" },
  { value: "RUST", label: "Rust" },
  { value: "TYPESCRIPT", label: "TypeScript" },
  { value: "PYTHON", label: "Python" },
];

const formatLanguage = (lang: LanguageName) => {
  switch (lang) {
    case "CPP": return "C++";
    case "JAVA": return "Java";
    case "JAVASCRIPT": return "JavaScript";
    case "TYPESCRIPT": return "TypeScript";
    case "PYTHON": return "Python";
    case "RUST": return "Rust";
    case "GO": return "Go";
    case "C":
    default: return "C";
  }
};

export default function PracticePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [language, setLanguage] = useState<LanguageName>("JAVASCRIPT");
  const [difficulty, setDifficulty] = useState<Difficulty>("BEGINNER");
  const [topic, setTopic] = useState<string>("any");
  const [snippet, setSnippet] = useState<PracticeSnippet | null>({
    id: null,
    content: "const sum = (a, b) => a + b;\nconsole.log(sum(5, 3));",
    languageName: "JAVASCRIPT",
    difficulty: "BEGINNER",
    topicName: "basics",
    isSample: true,
  });
  const [typed, setTyped] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [durationTarget, setDurationTarget] = useState(60);
  const [loadingSnippet, setLoadingSnippet] = useState(false);
  const [snippetError, setSnippetError] = useState<string | null>(null);
  const [savingResult, setSavingResult] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [hasRedirected, setHasRedirected] = useState(false);
  const [autoSavedOnTimeUp, setAutoSavedOnTimeUp] = useState(false);

  const isPremium = false; // TODO: wire to real subscription/plan when available

  const isTimeUp = elapsedSeconds >= durationTarget;
  const targetSnippet = snippet?.content ?? "";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/signin?callbackUrl=/practice");
    }
  }, [status, router]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((s) => {
          if (s + 1 >= durationTarget) {
            setIsRunning(false);
            return durationTarget;
          }
          return s + 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, durationTarget]);

  const stats = useMemo(() => {
    const trimmedTyped = typed.replace(/\s+$/g, "");
    const typedLength = trimmedTyped.length;
    const targetSlice = targetSnippet.slice(0, typedLength);
    let correctChars = 0;
    for (let i = 0; i < typedLength; i += 1) {
      if (trimmedTyped[i] === targetSlice[i]) correctChars += 1;
    }
    const accuracy = typedLength === 0 ? 100 : (correctChars / typedLength) * 100;
    const minutes = elapsedSeconds / 60;
    const wpm = minutes > 0 ? correctChars / 5 / minutes : 0;
    const progress = targetSnippet.length ? (typedLength / targetSnippet.length) * 100 : 0;
    const timeProgress = durationTarget > 0 ? Math.min((elapsedSeconds / durationTarget) * 100, 100) : 0;
    return {
      accuracy: Number.isFinite(accuracy) ? accuracy : 0,
      wpm: Number.isFinite(wpm) ? wpm : 0,
      progress: Math.min(progress, 100),
      timeProgress,
      correctChars,
      typedLength,
    };
  }, [typed, targetSnippet, elapsedSeconds, durationTarget]);

  const handleSaveResult = useCallback(async () => {
    if (!snippet) {
      setSaveMessage("No snippet loaded to save results for.");
      return;
    }

    setSavingResult(true);
    setSaveMessage(null);
    try {
      const res = await fetch("/api/practice/result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          snippetId: snippet.id ?? null,
          wpm: stats.wpm,
          accuracy: stats.accuracy,
          duration: elapsedSeconds,
          languageName: snippet.languageName,
          topicName: snippet.topicName,
          difficulty,
        }),
      });

      if (res.status === 401) {
        setSaveMessage("Please sign in to save your results.");
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save result.");
      }

      const payload = await res.json();
      setSaveMessage(
        `Saved. ${formatLanguage(language)} stats updated (best ${payload.bestWpm?.toFixed?.(1) ?? stats.wpm.toFixed(1)} WPM).`,
      );
    } catch (error) {
      console.error(error);
      setSaveMessage(
        error instanceof Error ? error.message : "Something went wrong while saving.",
      );
    } finally {
      setSavingResult(false);
    }
  }, [snippet, stats.wpm, stats.accuracy, elapsedSeconds, difficulty, language]);

  useEffect(() => {
    if (!isTimeUp || stats.typedLength === 0) return;

    // Auto-save once when time is up (only for signed-in users)
    if (!autoSavedOnTimeUp && session && !savingResult) {
      setAutoSavedOnTimeUp(true);
      void handleSaveResult();
    }

    if (hasRedirected) return;
    const params = new URLSearchParams({
      wpm: stats.wpm.toFixed(1),
      accuracy: stats.accuracy.toFixed(1),
      duration: String(elapsedSeconds),
      language,
      chars: `${stats.correctChars}/${stats.typedLength}`,
    });
    setHasRedirected(true);
    router.push(`/practice/result?${params.toString()}`);
  }, [isTimeUp, hasRedirected, autoSavedOnTimeUp, stats, elapsedSeconds, language, router, session, savingResult, handleSaveResult]);

  const fetchSnippet = async (
    overrideLanguage?: LanguageName,
    overrideDifficulty?: Difficulty,
    overrideTopic?: string,
  ) => {
    setLoadingSnippet(true);
    setSnippetError(null);
    setIsRunning(false);
    setTyped("");
    setElapsedSeconds(0);
    setHasRedirected(false);
    setAutoSavedOnTimeUp(false);
    setSaveMessage(null);

    const lang = overrideLanguage ?? language;
    const diff = overrideDifficulty ?? difficulty;
    const top = overrideTopic ?? topic;

    const params = new URLSearchParams({
      language: lang,
      difficulty: diff,
    });
    if (top !== "any") {
      params.set("topic", top);
    }

    try {
      const res = await fetch(`/api/practice/snippet?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load snippet");
      }
      const data: PracticeSnippet = await res.json();
      setSnippet(data);
    } catch (error) {
      console.error(error);
      setSnippetError(
        error instanceof Error ? error.message : "Unable to load practice snippet right now.",
      );
    } finally {
      setLoadingSnippet(false);
    }
  };

  const handleStart = () => {
    if (loadingSnippet) return;
    setTyped("");
    setElapsedSeconds(0);
    setHasRedirected(false);
    setAutoSavedOnTimeUp(false);
    setIsRunning(true);
    setSaveMessage(null);
  };

  const handleReset = () => {
    setTyped("");
    setElapsedSeconds(0);
    setIsRunning(false);
    setHasRedirected(false);
    setAutoSavedOnTimeUp(false);
    setSaveMessage(null);
  };

  const snippetSource = snippet?.isSample
    ? "Sample snippet (add DB snippets to persist results)"
    : "Database snippet";

  const sampleTopics = SAMPLE_TOPICS[language] ?? [];

  const statusLabel = loadingSnippet
    ? "Loading..."
    : isRunning
      ? "Running"
      : isTimeUp
        ? "Time up"
        : "Ready";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header1 />

      <main className="container mx-auto px-3 sm:px-4 pb-4 sm:pb-6 pt-16 sm:pt-20">
        <section className="grid gap-3 sm:gap-4 lg:grid-cols-[340px_minmax(0,1fr)] items-start">
          <PracticeSidebar
            languages={LANGUAGES}
            premiumLanguages={PREMIUM_LANGUAGES}
            isPremium={isPremium}
            language={language}
            onLanguageChange={(lang) => {
              const locked = PREMIUM_LANGUAGES.includes(lang) && !isPremium;
              if (locked) {
                setSnippetError("Premium required for this language.");
                return;
              }
              setSnippetError(null);
              setLanguage(lang);
              setTopic("any");
              void fetchSnippet(lang, difficulty, "any");
            }}
            difficulty={difficulty}
            onDifficultyChange={setDifficulty}
            topic={topic}
            onTopicChange={setTopic}
            sampleTopics={sampleTopics}
            durationTarget={durationTarget}
            onDurationChange={setDurationTarget}
            snippetSource={snippetSource}
            snippetTopic={snippet?.topicName}
            loadingSnippet={loadingSnippet}
            onStart={handleStart}
            onReset={handleReset}
            onNewSnippet={fetchSnippet}
            onSave={handleSaveResult}
            saveDisabled={savingResult || !session}
            statusLabel={statusLabel}
          />

          {/* RIGHT MAIN AREA */}
          <div className="space-y-3 sm:space-y-4">
            <div className="rounded-xl sm:rounded-2xl border border-border/70 bg-card/95 backdrop-blur px-3 sm:px-4 md:px-5 py-3 sm:py-4 shadow-[0_14px_32px_rgba(0,0,0,0.3)]">
              <div className="mb-2 sm:mb-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span>{formatLanguage(language)}</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="capitalize">{difficulty.toLowerCase()}</span>
                  {snippet?.topicName ? (
                    <>
                      <span className="hidden sm:inline">•</span>
                      <span className="truncate max-w-[100px] sm:max-w-none">{snippet.topicName}</span>
                    </>
                  ) : null}
                  {snippet?.isSample ? (
                    <>
                      <span className="hidden sm:inline">•</span>
                      <span className="text-[10px] sm:text-[11px] rounded-full border border-border/60 px-1.5 sm:px-2 py-0.5">
                        Sample
                      </span>
                    </>
                  ) : null}
                </p>
                <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] md:text-xs text-muted-foreground">
                  <Timer className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span>
                    {elapsedSeconds}s / {durationTarget}s
                  </span>
                </div>
              </div>

              <div className="relative h-[400px] sm:h-[460px] md:h-[520px] rounded-lg sm:rounded-xl border border-border/70 bg-background px-3 sm:px-4 py-3 sm:py-4 font-mono text-xs sm:text-sm md:text-base leading-relaxed overflow-y-auto">
                {loadingSnippet ? (
                  <span className="text-muted-foreground">Loading snippet...</span>
                ) : (
                  <div className="whitespace-pre-wrap break-words leading-relaxed pointer-events-none select-none">
                    {renderInlineSnippet(targetSnippet, typed)}
                  </div>
                )}
                <textarea
                  aria-label="Type the code"
                  value={typed}
                autoFocus
                  onChange={(e) => {
                    if (isTimeUp || loadingSnippet) return;
                    if (!isRunning) setIsRunning(true);
                    setTyped(e.target.value);
                  }}
                onFocus={() => {
                  if (!isRunning && !loadingSnippet && !isTimeUp) setIsRunning(true);
                }}
                  placeholder="Start typing the code above..."
                  disabled={loadingSnippet || isTimeUp}
                  className="absolute inset-0 w-full h-full resize-none bg-transparent text-transparent caret-transparent focus:outline-none"
                  spellCheck={false}
                />
              </div>
            </div>

            {/* Stats section hidden to keep the coding area focused and spacious */}

            {saveMessage && (
              <div className="flex items-start gap-2 rounded-lg border border-border/70 bg-muted/40 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm">
                {saveMessage.toLowerCase().includes("saved") ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 flex-shrink-0" />
                ) : (
                  <AlertCircle className="mt-0.5 h-4 w-4 sm:h-5 sm:w-5 text-amber-500 flex-shrink-0" />
                )}
                <span className="break-words">{saveMessage}</span>
              </div>
            )}

            {snippetError && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="break-words">{snippetError}</span>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function renderInlineSnippet(snippet: string, typed: string) {
  // Determine current line (based on caret at end of typed text)
  const currentLineStart = typed.lastIndexOf("\n") + 1;
  const nextNewline = typed.indexOf("\n", currentLineStart);
  const currentLineEnd = nextNewline === -1 ? typed.length : nextNewline;
  const caretIndex = typed.length;

  // Pre-compute which characters belong to a word that has any mistake
  const wordHasError: boolean[] = new Array(snippet.length).fill(false);
  let wordStart = 0;
  for (let i = 0; i <= snippet.length; i += 1) {
    const isBoundary = i === snippet.length || snippet[i] === " " || snippet[i] === "\n" || snippet[i] === "\t";
    if (isBoundary) {
      if (i > wordStart) {
        let hasError = false;
        for (let j = wordStart; j < i; j += 1) {
          const typedChar = typed[j];
          if (typedChar !== undefined && typedChar !== snippet[j]) {
            hasError = true;
            break;
          }
        }
        if (hasError) {
          for (let j = wordStart; j < i; j += 1) {
            wordHasError[j] = true;
          }
        }
      }
      wordStart = i + 1;
    }
  }

  const spans: React.ReactNode[] = [];

  snippet.split("").forEach((ch, idx) => {
    const typedChar = typed[idx];
    const state = typedChar === undefined ? "pending" : typedChar === ch ? "correct" : "incorrect";
    const inCurrentLine = idx >= currentLineStart && idx < currentLineEnd;

    let className = "text-slate-500";

    if (state === "incorrect" || wordHasError[idx]) {
      // Mistyped word: only red text, no background so it doesn't feel heavy
      className = "text-red-400 underline decoration-red-500 decoration-2";
    } else if (inCurrentLine) {
      // Correct current line: bright white with a very soft glow
      className = "text-white";
    }

    spans.push(
      <span key={idx} className={className}>
        {ch === " " ? "\u00A0" : ch}
      </span>
    );

    // If caret is exactly after this character, render a thin white caret bar
    if (idx === caretIndex - 1 && caretIndex <= snippet.length) {
      spans.push(
        <span
          key={`caret-${idx}`}
          className="inline-block w-[2px] h-[1.1em] align-middle bg-white rounded-sm mx-[1px]"
        />
      );
    }
  });

  // If caret is at the very start (no typed chars yet), show it at the beginning
  if (caretIndex === 0) {
    spans.unshift(
      <span
        key="caret-start"
        className="inline-block w-[2px] h-[1.1em] align-middle bg-white rounded-sm mr-[1px]"
      />
    );
  }

  return spans;
}
