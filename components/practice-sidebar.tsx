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
  onStart,
  onReset,
  onNewSnippet,
  onSave,
  saveDisabled,
  statusLabel,
}: SidebarProps) {
  return (
    <aside className="rounded-xl sm:rounded-2xl border border-border/70 bg-card/90 backdrop-blur px-3 sm:px-4 py-3 sm:py-4 space-y-3 sm:space-y-4 shadow-[0_12px_40px_rgba(0,0,0,0.3)] lg:sticky lg:top-20 lg:min-h-[85vh] lg:flex lg:flex-col lg:justify-between">
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs sm:text-sm font-semibold">Session controls</p>
          <span className="text-[10px] sm:text-[11px] text-muted-foreground uppercase tracking-[0.14em] hidden sm:inline">
            Sidebar
          </span>
        </div>

      <Select
        value={language}
        onValueChange={(value) => {
          const lang = value as LanguageName;
          // Always call onLanguageChange - it will handle premium check and show modal
          // If premium and locked, onLanguageChange will return early and not update state
          // This means the Select will try to change but the controlled value won't update
          onLanguageChange(lang);
        }}
      >
        <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
          <SelectValue placeholder="Language" />
        </SelectTrigger>
        <SelectContent className="z-[100]">
          {languages.map((lang) => {
            const locked = premiumLanguages.includes(lang.value) && !isPremium;
            return (
              <SelectItem 
                key={lang.value} 
                value={lang.value}
                className={locked ? "opacity-60" : ""}
              >
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
        <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
          <SelectValue placeholder="Difficulty" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="BEGINNER">Beginner</SelectItem>
          <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
          <SelectItem value="ADVANCED">Advanced</SelectItem>
        </SelectContent>
      </Select>

      <Select value={topic} onValueChange={(value) => onTopicChange(value)}>
        <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
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

      <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs text-muted-foreground">
        <Clock3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
        <div className="flex items-center gap-1.5 sm:gap-2 w-full">
          <span className="min-w-[45px] sm:min-w-[50px]">{durationTarget}s</span>
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

        <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground flex-wrap">
          <span className="rounded-full border border-border/70 bg-muted/40 px-1.5 sm:px-2 py-0.5 sm:py-1">
            {snippetSource === "Sample snippet (add DB snippets to persist results)"
              ? "Sample"
              : "DB"}
          </span>
          {snippetTopic ? (
            <span className="rounded-full border border-border/70 bg-muted/40 px-1.5 sm:px-2 py-0.5 sm:py-1 truncate max-w-[120px] sm:max-w-none">
              {snippetTopic}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground pt-2 border-t border-border/40 mt-2 sm:mt-3">
        <Button size="sm" onClick={onStart} disabled={loadingSnippet} className="text-xs h-8 sm:h-9 px-2 sm:px-3">
          Start
        </Button>
        <Button size="sm" variant="secondary" onClick={onReset} disabled={loadingSnippet} className="text-xs h-8 sm:h-9 px-2 sm:px-3">
          Reset
        </Button>
        <Button size="sm" variant="outline" onClick={onNewSnippet} disabled={loadingSnippet} className="text-xs h-8 sm:h-9 px-2 sm:px-3">
          <RefreshCw className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
          New
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onSave}
          disabled={loadingSnippet || saveDisabled}
          className="text-xs h-8 sm:h-9 px-2 sm:px-3"
        >
          <Save className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
          Save
        </Button>
        <span className="ml-auto text-[10px] sm:text-[11px] text-muted-foreground hidden sm:inline">
          {statusLabel}
        </span>
      </div>
    </aside>
  );
}

