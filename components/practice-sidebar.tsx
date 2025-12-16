"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Clock3, RefreshCw, Save } from "lucide-react";

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

type SidebarProps = {
  languages: { value: LanguageName; label: string }[];
  premiumLanguages: LanguageName[];
  isPremium: boolean;
  language: LanguageName;
  onLanguageChange: (lang: LanguageName) => void;
  difficulty: Difficulty;
  onDifficultyChange: (d: Difficulty) => void;
  topic: string;
  onTopicChange: (t: string) => void;
  sampleTopics: string[];
  durationTarget: number;
  onDurationChange: (v: number) => void;
  snippetSource: string;
  snippetTopic?: string | null;
  loadingSnippet: boolean;
  isRunning: boolean;
  isTimeUp: boolean;
  onStart: () => void;
  onReset: () => void;
  onNewSnippet: () => void;
  onSave: () => void;
  saveDisabled: boolean;
  statusLabel: string;
};

export function PracticeSidebar({
  languages,
  premiumLanguages,
  isPremium,
  language,
  onLanguageChange,
  difficulty,
  onDifficultyChange,
  topic,
  onTopicChange,
  sampleTopics,
  durationTarget,
  onDurationChange,
  snippetSource,
  snippetTopic,
  loadingSnippet,
  isRunning,
  isTimeUp,
  onStart,
  onReset,
  onNewSnippet,
  onSave,
  saveDisabled,
  statusLabel,
}: SidebarProps) {
  return (
    <aside className="rounded-2xl border border-border/70 bg-card/90 backdrop-blur px-3 py-4 space-y-4 shadow-[0_12px_40px_rgba(0,0,0,0.3)] lg:sticky lg:top-20 lg:min-h-[85vh] lg:flex lg:flex-col lg:justify-between">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Session controls</p>
          <span className="text-[11px] text-muted-foreground uppercase tracking-[0.14em]">
            Sidebar
          </span>
        </div>

      <Select
        value={language}
        onValueChange={(value) => onLanguageChange(value as LanguageName)}
      >
        <SelectTrigger className="h-10">
          <SelectValue placeholder="Language" />
        </SelectTrigger>
        <SelectContent>
          {languages.map((lang) => {
            const locked = premiumLanguages.includes(lang.value) && !isPremium;
            return (
              <SelectItem key={lang.value} value={lang.value} disabled={locked}>
                <div className="flex items-center gap-2">
                  <span>{lang.label}</span>
                  {premiumLanguages.includes(lang.value) ? (
                    <span className="text-[10px] text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded">
                      Premium
                    </span>
                  ) : null}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      <Select
        value={difficulty}
        onValueChange={(value) => onDifficultyChange(value as Difficulty)}
      >
        <SelectTrigger className="h-10">
          <SelectValue placeholder="Difficulty" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="BEGINNER">Beginner</SelectItem>
          <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
          <SelectItem value="ADVANCED">Advanced</SelectItem>
        </SelectContent>
      </Select>

      <Select value={topic} onValueChange={(value) => onTopicChange(value)}>
        <SelectTrigger className="h-10">
          <SelectValue placeholder="Topic" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Any topic</SelectItem>
          {sampleTopics.map((t) => (
            <SelectItem key={t} value={t}>
              {t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-xs text-muted-foreground">
        <Clock3 className="h-4 w-4" />
        <div className="flex items-center gap-2 w-full">
          <span>{durationTarget}s</span>
          <Slider
            className="w-full"
            value={[durationTarget]}
            onValueChange={([v]) => onDurationChange(v)}
            min={30}
            max={180}
            step={10}
          />
        </div>
      </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full border border-border/70 bg-muted/40 px-2 py-1">
            {snippetSource === "Sample snippet (add DB snippets to persist results)"
              ? "Sample"
              : "DB"}
          </span>
          {snippetTopic ? (
            <span className="rounded-full border border-border/70 bg-muted/40 px-2 py-1">
              {snippetTopic}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/40 mt-3">
        <Button size="sm" onClick={onStart} disabled={loadingSnippet}>
          Start
        </Button>
        <Button size="sm" variant="secondary" onClick={onReset} disabled={loadingSnippet}>
          Reset
        </Button>
        <Button size="sm" variant="outline" onClick={onNewSnippet} disabled={loadingSnippet}>
          <RefreshCw className="mr-2 h-4 w-4" />
          New
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onSave}
          disabled={loadingSnippet || saveDisabled}
        >
          <Save className="mr-2 h-4 w-4" />
          Save
        </Button>
        <span className="ml-auto text-[11px] text-muted-foreground">
          {loadingSnippet
            ? "Loading..."
            : isRunning
              ? "Running"
              : isTimeUp
                ? "Time up"
                : "Ready"}
        </span>
      </div>
    </aside>
  );
}

