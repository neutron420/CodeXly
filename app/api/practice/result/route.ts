import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Difficulty, LanguageName } from "@prisma/client";

type ResultPayload = {
  snippetId: string | null;
  wpm: number;
  accuracy: number;
  duration?: number | null;
  languageName?: string | null;
  topicName?: string | null;
  difficulty?: string | null;
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: ResultPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { snippetId, wpm, accuracy, duration, languageName, topicName, difficulty } = body;

  if (!Number.isFinite(wpm) || wpm < 0 || wpm > 1000) {
    return NextResponse.json({ error: "wpm must be between 0 and 1000" }, { status: 400 });
  }

  if (!Number.isFinite(accuracy) || accuracy < 0 || accuracy > 100) {
    return NextResponse.json({ error: "accuracy must be between 0 and 100" }, { status: 400 });
  }

  if (duration !== undefined && duration !== null && (!Number.isFinite(duration) || duration < 0)) {
    return NextResponse.json({ error: "duration must be a positive number" }, { status: 400 });
  }

  try {
    // If we don't have a snippet id (e.g. sample run), create a simple snippet row first,
    // then use that id for the transactional stats update.
    let effectiveSnippetId = snippetId;

    if (!effectiveSnippetId) {
      if (!languageName) {
        return NextResponse.json(
          { error: "languageName is required when snippetId is null" },
          { status: 400 },
        );
      }

      const languageRow = await prisma.language.upsert({
        where: { name: languageName as LanguageName },
        update: {},
        create: { name: languageName as LanguageName },
      });

      const topicRow = await prisma.topic.upsert({
        where: { name: topicName ?? `${languageName.toLowerCase()}-practice` },
        update: {},
        create: { name: topicName ?? `${languageName.toLowerCase()}-practice` },
      });

      const createdSnippet = await prisma.snippet.create({
        data: {
          languageId: languageRow.id,
          topicId: topicRow.id,
          difficulty: (difficulty as Difficulty) ?? Difficulty.BEGINNER,
          content: "// practice sample (auto-created for stats)",
        },
      });

      effectiveSnippetId = createdSnippet.id;
    }

    const resultData = await prisma.$transaction(async (tx) => {
      const snippet = await tx.snippet.findUnique({
        where: { id: effectiveSnippetId! },
        include: { language: true },
      });

      if (!snippet) {
        throw new Error("Snippet not found");
      }

      const result = await tx.result.create({
        data: {
          userId,
          snippetId: snippet.id,
          wpm,
          accuracy,
          duration: duration ?? null,
        },
      });

      const existingStats = await tx.userLanguageStats.findUnique({
        where: {
          userId_languageName: {
            userId,
            languageName: snippet.language.name,
          },
        },
      });

      const previousCount = existingStats?.snippetsCompleted ?? 0;
      const newCount = previousCount + 1;
      const averageWpm =
        ((existingStats?.averageWpm ?? 0) * previousCount + wpm) / newCount;
      const averageAccuracy =
        ((existingStats?.averageAccuracy ?? 0) * previousCount + accuracy) / newCount;
      const bestWpm = Math.max(existingStats?.bestWpm ?? 0, wpm);

      const stats = await tx.userLanguageStats.upsert({
        where: {
          userId_languageName: {
            userId,
            languageName: snippet.language.name,
          },
        },
        update: {
          averageWpm,
          averageAccuracy,
          snippetsCompleted: newCount,
          bestWpm,
        },
        create: {
          userId,
          languageName: snippet.language.name,
          averageWpm,
          averageAccuracy,
          snippetsCompleted: newCount,
          bestWpm,
        },
      });

      return {
        resultId: result.id,
        languageName: stats.languageName,
        averageWpm: stats.averageWpm,
        averageAccuracy: stats.averageAccuracy,
        bestWpm: stats.bestWpm,
        snippetsCompleted: stats.snippetsCompleted,
      };
    });

    return NextResponse.json(resultData, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status = message === "Snippet not found" ? 404 : 500;
    if (status === 500) {
      console.error("POST /api/practice/result failed", error);
    }
    return NextResponse.json({ error: message }, { status });
  }
}

