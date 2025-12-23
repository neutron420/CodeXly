import { Header1 } from "@/components/ui/header";
import prisma from "@/lib/prisma";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Target, Gauge } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type LeaderboardRow = {
  userId: string;
  name: string;
  email: string | null;
  image: string | null;
  runs: number;
  bestWpm: number;
  bestAccuracy: number;
  avgWpm: number;
};

const getInitials = (name?: string | null) => {
  if (!name) return "?";
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0]?.[0]?.toUpperCase() ?? "?";
  return `${parts[0]?.[0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}`.toUpperCase();
};

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/signin?callbackUrl=/leaderboard");
  }

  const grouped = await prisma.result.groupBy({
    by: ["userId"],
    _max: { wpm: true, accuracy: true },
    _avg: { wpm: true },
    _count: { _all: true },
  });

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, image: true },
  });

  const statsByUser = new Map(
    grouped.map((g) => [
      g.userId,
      {
        runs: g._count._all,
        bestWpm: g._max.wpm ?? 0,
        bestAccuracy: g._max.accuracy ?? 0,
        avgWpm: g._avg.wpm ?? 0,
      },
    ]),
  );

  const rows: LeaderboardRow[] = users.map((user) => {
    const stats = statsByUser.get(user.id);
    return {
      userId: user.id,
      name: user.name ?? "Anonymous",
      email: user.email ?? null,
      image: user.image ?? null,
      runs: stats?.runs ?? 0,
      bestWpm: stats?.bestWpm ?? 0,
      bestAccuracy: stats?.bestAccuracy ?? 0,
      avgWpm: stats?.avgWpm ?? 0,
    };
  });

  rows.sort((a, b) => {
    // Users with runs first, sorted by bestWpm desc; then users with 0 runs by name.
    if (a.runs === 0 && b.runs === 0) {
      return a.name.localeCompare(b.name);
    }
    if (a.runs === 0) return 1;
    if (b.runs === 0) return -1;
    return b.bestWpm - a.bestWpm;
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header1 />
      <main className="container mx-auto px-4 sm:px-6 pb-8 sm:pb-16 pt-20 sm:pt-24 space-y-6 sm:space-y-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.18em] text-muted-foreground">Leaderboard</p>
            <h1 className="text-xl sm:text-2xl font-semibold">Top practice performers</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Ranked by best recorded WPM from saved results.</p>
          </div>
          <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-amber-400 flex-shrink-0" />
        </div>

        <Card className="border border-border/70 shadow-sm">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Global ranking</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              All registered users. Those without saved practice runs show 0 statistics.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0 sm:p-6">
            {rows.length === 0 ? (
              <div className="py-8 sm:py-12 text-center text-muted-foreground text-sm">No results yet.</div>
            ) : (
              <>
                {/* Desktop Table View */}
                <table className="hidden md:table w-full text-sm">
                  <thead className="text-left text-muted-foreground">
                    <tr className="border-b border-border/60">
                      <th className="py-2 pr-4">Rank</th>
                      <th className="py-2 pr-4">User</th>
                      <th className="py-2 pr-4">Best WPM</th>
                      <th className="py-2 pr-4">Best Accuracy</th>
                      <th className="py-2 pr-4">Avg WPM</th>
                      <th className="py-2">Runs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr
                        key={row.userId}
                        className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition"
                      >
                        <td className="py-3 pr-4 font-semibold text-muted-foreground">#{idx + 1}</td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={row.image ?? undefined} alt={row.name} />
                              <AvatarFallback>{getInitials(row.name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground">{row.name}</span>
                              {row.email ? (
                                <span className="text-xs text-muted-foreground">{row.email}</span>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-4 font-semibold text-foreground flex items-center gap-1">
                          <Gauge className="h-4 w-4 text-primary" />
                          {row.bestWpm.toFixed(1)}
                        </td>
                        <td className="py-3 pr-4 text-foreground flex items-center gap-1">
                          <Target className="h-4 w-4 text-emerald-500" />
                          {row.bestAccuracy.toFixed(1)}%
                        </td>
                        <td className="py-3 pr-4 text-foreground">{row.avgWpm.toFixed(1)}</td>
                        <td className="py-3 text-foreground">{row.runs}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3 p-4">
                  {rows.map((row, idx) => (
                    <Card key={row.userId} className="border border-border/40">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-muted-foreground">#{idx + 1}</span>
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={row.image ?? undefined} alt={row.name} />
                              <AvatarFallback>{getInitials(row.name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground text-sm">{row.name}</span>
                              {row.email ? (
                                <span className="text-xs text-muted-foreground truncate max-w-[180px]">{row.email}</span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/40">
                          <div className="flex items-center gap-2">
                            <Gauge className="h-4 w-4 text-primary" />
                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground">Best WPM</span>
                              <span className="font-semibold text-foreground">{row.bestWpm.toFixed(1)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-emerald-500" />
                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground">Accuracy</span>
                              <span className="font-semibold text-foreground">{row.bestAccuracy.toFixed(1)}%</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground">Avg WPM</span>
                              <span className="font-semibold text-foreground">{row.avgWpm.toFixed(1)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground">Runs</span>
                              <span className="font-semibold text-foreground">{row.runs}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

