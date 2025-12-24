import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { Difficulty, LanguageName } from "@prisma/client";

type TopicStat = {
  topicName: string;
  attempts: number;
  averageAccuracy: number;
  averageWpm: number;
};

type PracticeStatsResponse = {
  languageName: LanguageName;
  averageWpm: number;
  averageAccuracy: number;
  bestWpm: number;
  snippetsCompleted: number;
  level: number;
  xp: number;
  difficultiesUnlocked: Difficulty[];
  nextUnlock?: {
    difficulty: Difficulty;
    requiredSnippets: number;
    requiredAccuracy: number;
  };
  topics: TopicStat[];
  weakTopics: string[];
  strongTopics: string[];
};

const BEGINNER_UNLOCK: { difficulty: Difficulty; requiredSnippets: number; requiredAccuracy: number }[] =
  [
    { difficulty: Difficulty.INTERMEDIATE, requiredSnippets: 10, requiredAccuracy: 88 },
    { difficulty: Difficulty.ADVANCED, requiredSnippets: 25, requiredAccuracy: 92 },
  ];

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const languageParam = searchParams.get("language")?.toUpperCase() ?? null;

  if (!languageParam || !Object.values(LanguageName).includes(languageParam as LanguageName)) {
    return NextResponse.json({ error: "Invalid or missing language." }, { status: 400 });
  }

  const languageName = languageParam as LanguageName;

  try {
    const statsRow = await prisma.userLanguageStats.findUnique({
      where: {
        userId_languageName: {
          userId,
          languageName,
        },
      },
    });

    const averageWpm = statsRow?.averageWpm ?? 0;
    const averageAccuracy = statsRow?.averageAccuracy ?? 0;
    const bestWpm = statsRow?.bestWpm ?? 0;
    const snippetsCompleted = statsRow?.snippetsCompleted ?? 0;

    // Simple XP/level system derived from practice volume and quality.
    const xp = Math.round(snippetsCompleted * (averageAccuracy / 100) * 10);
    const level = Math.max(1, Math.floor(xp / 100) + 1);

    const difficultiesUnlocked: Difficulty[] = [Difficulty.BEGINNER];
    let nextUnlock: PracticeStatsResponse["nextUnlock"] | undefined;

    for (const rule of BEGINNER_UNLOCK) {
      const meets =
        snippetsCompleted >= rule.requiredSnippets && averageAccuracy >= rule.requiredAccuracy;

      if (meets) {
        if (!difficultiesUnlocked.includes(rule.difficulty)) {
          difficultiesUnlocked.push(rule.difficulty);
        }
      } else if (!nextUnlock) {
        // First unmet rule is the next unlock target.
        nextUnlock = rule;
      }
    }

    // Per-topic aggregation (recent history, limited for performance)
    const recentResults = await prisma.result.findMany({
      where: { userId },
      take: 500,
      orderBy: { createdAt: "desc" },
      include: {
        snippet: {
          include: {
            topic: true,
            language: true,
          },
        },
      },
    });

    const topicMap = new Map<string, { totalAcc: number; totalWpm: number; attempts: number }>();

    for (const row of recentResults) {
      if (!row.snippet || row.snippet.language.name !== languageName) continue;
      const topicName = row.snippet.topic?.name ?? "general";

      const key = topicName.toLowerCase();
      const existing = topicMap.get(key) ?? { totalAcc: 0, totalWpm: 0, attempts: 0 };
      existing.totalAcc += row.accuracy;
      existing.totalWpm += row.wpm;
      existing.attempts += 1;
      topicMap.set(key, existing);
    }

    const topics: TopicStat[] = Array.from(topicMap.entries()).map(([key, agg]) => ({
      topicName: key,
      attempts: agg.attempts,
      averageAccuracy: agg.attempts > 0 ? agg.totalAcc / agg.attempts : 0,
      averageWpm: agg.attempts > 0 ? agg.totalWpm / agg.attempts : 0,
    }));

    const weakTopics = topics
      .filter((t) => t.attempts >= 2 && t.averageAccuracy < 90)
      .map((t) => t.topicName);

    const strongTopics = topics
      .filter((t) => t.attempts >= 2 && t.averageAccuracy >= 95)
      .map((t) => t.topicName);

    const payload: PracticeStatsResponse = {
      languageName,
      averageWpm,
      averageAccuracy,
      bestWpm,
      snippetsCompleted,
      level,
      xp,
      difficultiesUnlocked,
      nextUnlock,
      topics,
      weakTopics,
      strongTopics,
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("GET /api/practice/stats failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


