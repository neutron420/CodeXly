// server component: do not mark as client to avoid bundling server-only deps
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { Header1 } from "@/components/ui/header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; 
import { Progress } from "@/components/ui/progress"; 
import prisma from "@/lib/prisma"; 
import { type UserLanguageStats, type LanguageName, type Result } from "@prisma/client"; 
import { BarChart, Clock, Percent, Zap, User as UserIcon, Settings, Activity, Flame } from "lucide-react"; // Icons
import { Button } from "@/components/ui/button"; 

export const dynamic = "force-dynamic";

// Helper to get initials
const getInitials = (name?: string | null): string => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length === 1) return names[0]?.[0]?.toUpperCase() ?? '?';
    return ((names[0]?.[0] ?? '') + (names[names.length - 1]?.[0] ?? '')).toUpperCase();
};

// Helper function to format language names (Updated)
const formatLanguageName = (name: LanguageName): string => {
    switch (name) {
        case 'CPP': return 'C++';
        case 'C': return 'C'; // Explicitly defined C
        case 'TYPESCRIPT': return 'TypeScript';
        case 'JAVASCRIPT': return 'JavaScript';
        // --- ADDED EXPLICIT CASES ---
        case 'PYTHON': return 'Python';
        case 'RUST': return 'Rust';
        case 'JAVA': return 'Java';
        case 'GO': return 'Go';
        // --- END ADD ---
        default:
            // Fallback for safety, though all enum members should be covered
            console.warn("Unhandled LanguageName in formatLanguageName:", name);
            return (name as string).charAt(0) + (name as string).slice(1).toLowerCase();
    }
}


// Define the SessionUser type locally if not defined globally
interface SessionUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser | undefined; // Type assertion

  // Redirect if not logged in
  if (!user?.id) { // Check for ID which should be added by callbacks
    redirect("/signin?callbackUrl=/profile");
  }

  // Fetch user stats
  let languageStats: UserLanguageStats[] = [];
  let yearlyResults: Pick<Result, "id" | "createdAt" | "duration" | "wpm" | "accuracy">[] = [];
  try {
    languageStats = await prisma.userLanguageStats.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });

    // Pull all results across users for the contribution heatmap so activity
    // always reflects the latest practice data (like a global GitHub grid).
    yearlyResults = await prisma.result.findMany({
      select: {
        id: true,
        createdAt: true,
        duration: true,
        wpm: true,
        accuracy: true,
      },
      orderBy: { createdAt: "asc" },
    });
  } catch (error) {
    console.error("Failed to fetch language stats:", error);
    // You could pass an error state to the client component if needed
  }

  const contributions = buildContributionGrid(yearlyResults);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header1 />
      <div className="container mx-auto px-4 pt-28 pb-16">

        {/* Profile Header Card */}
        <Card className="mb-8 overflow-hidden border border-border shadow-sm">
          <CardHeader className="flex flex-row items-center space-x-6 p-6 bg-card"> {/* Row layout */}
            <Avatar className="h-20 w-20 border-2 border-primary">
              <AvatarImage src={user.image ?? undefined} alt={user.name ?? 'User'} />
              <AvatarFallback className="text-2xl bg-primary/80 text-primary-foreground">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
                <CardTitle className="text-2xl">{user.name ?? 'User Profile'}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
                {/* Optional: Add member since date */}
                {/* <CardDescription className="text-xs mt-1">Member since {new Date(user.createdAt).toLocaleDateString()}</CardDescription> */}
            </div>
          </CardHeader>
        </Card>

        <Card className="mb-8 border border-border/70 shadow-sm">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">Practice streak heatmap</CardTitle>
              <CardDescription>Daily saved results across the last 52 weeks.</CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="inline-block h-3 w-3 rounded-sm bg-[rgb(31,41,55)] border border-border/50" />
                None
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-3 w-3 rounded-sm bg-amber-950" />
                Low
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-3 w-3 rounded-sm bg-amber-800" />
                Med
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-3 w-3 rounded-sm bg-amber-500" />
                High
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-3 w-3 rounded-sm bg-amber-300" />
                Max
              </span>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {contributions.weeks.length === 0 ? (
              <p className="py-10 text-sm text-muted-foreground text-center">
                No saved practice yet. Complete a run and hit <span className="font-semibold">Save</span> to start filling this grid.
              </p>
            ) : (
              <>
                <div className="ml-8 mb-2 flex gap-[3px] text-[10px] text-muted-foreground">
                  {contributions.monthLabels.map((label, idx) => (
                    <span key={idx} className="w-3.5 text-center">
                      {label ?? ""}
                    </span>
                  ))}
                </div>
                <div className="flex gap-[3px]">
                  <div className="mr-2 flex flex-col justify-between py-1 text-[10px] text-muted-foreground">
                    <span>Mon</span>
                    <span>Wed</span>
                    <span>Fri</span>
                  </div>
                  {contributions.weeks.map((week, idx) => (
                    <div key={idx} className="flex flex-col gap-[3px]">
                      {week.map((day) => (
                        <div
                          key={day.date}
                          className={`h-3.5 w-3.5 rounded-[3px] border border-border/40 ${contributionClass(day.count)}`}
                          title={`${day.dateLabel}: ${day.count} session${day.count === 1 ? "" : "s"}`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Data based on saved practice results; unsaved runs are not counted.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Tabs for Profile Sections */}
        <Tabs defaultValue="stats" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="stats">
                <Activity className="w-4 h-4 mr-2" /> Language Stats
            </TabsTrigger>
            <TabsTrigger value="profile">
                 <UserIcon className="w-4 h-4 mr-2" /> Profile Details
            </TabsTrigger>
            <TabsTrigger value="account">
                <Settings className="w-4 h-4 mr-2" /> Account
            </TabsTrigger>
          </TabsList>

          {/* Language Stats Tab Content */}
          <TabsContent value="stats">
            <Card className="border border-border">
              <CardHeader>
                <CardTitle>Coding Language Performance</CardTitle>
                <CardDescription>Your progress across different languages.</CardDescription>
              </CardHeader>
              <CardContent>
                {languageStats.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> {/* Adjusted gap */}
                    {languageStats.map((stat) => (
                      <Card key={stat.id} className="flex flex-col border border-border/50"> {/* Subtle border for stat cards */}
                        <CardHeader className="pb-3"> {/* Reduced padding */}
                          <CardTitle className="text-lg">{formatLanguageName(stat.languageName)}</CardTitle> {/* Uses updated function */}
                          {/* <CardDescription>Last Practiced: {new Date(stat.updatedAt).toLocaleDateString()}</CardDescription> */}
                        </CardHeader>
                        <CardContent className="flex-grow space-y-4 pt-0"> {/* Reduced padding top */}
                           <div className="space-y-1">
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <span className="flex items-center"><Zap className="w-4 h-4 mr-1.5"/> Average WPM</span>
                                    <span className="font-semibold text-foreground">{stat.averageWpm.toFixed(1)}</span>
                                </div>
                                {/* Progress bar for WPM could be added here if you have a target/max WPM */}
                           </div>

                           <div className="space-y-1">
                               <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
                                    <span className="flex items-center"><Percent className="w-4 h-4 mr-1.5"/> Average Accuracy</span>
                                    <span className="font-semibold text-foreground">{stat.averageAccuracy.toFixed(1)}%</span>
                               </div>
                               <Progress value={stat.averageAccuracy} className="h-2" />
                           </div>

                           <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center text-muted-foreground"><BarChart className="w-4 h-4 mr-1.5"/> Snippets Done</span>
                                <span className="font-medium text-foreground">{stat.snippetsCompleted}</span>
                           </div>
                           <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center text-muted-foreground"><Zap className="w-4 h-4 mr-1.5 text-amber-500"/> Best WPM</span>
                                <span className="font-medium text-amber-500">{stat.bestWpm.toFixed(1)}</span>
                           </div>
                             <div className="flex items-center justify-between text-sm pt-2 border-t border-border/50">
                                <span className="flex items-center text-muted-foreground text-xs"><Clock className="w-3 h-3 mr-1.5"/> Last Practice</span>
                                <span className="font-medium text-foreground text-xs">{new Date(stat.updatedAt).toLocaleDateString()}</span>
                           </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                    <div className="text-center py-10">
                        <p className="text-muted-foreground">No language statistics found yet.</p>
                        {/* Optional: Add a link/button */}
                        {/* <Button variant="link" asChild className="mt-2"><Link href="/compiler">Start Coding!</Link></Button> */}
                    </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Details Tab Content */}
          <TabsContent value="profile">
            <Card className="border border-border">
              <CardHeader>
                <CardTitle>Profile Details</CardTitle>
                <CardDescription>Your account information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="flex flex-col space-y-1.5">
                    <span className="text-sm font-medium text-muted-foreground">Name</span>
                    <p className="text-foreground">{user.name ?? 'Not Provided'}</p>
                 </div>
                 <div className="flex flex-col space-y-1.5">
                    <span className="text-sm font-medium text-muted-foreground">Email</span>
                    <p className="text-foreground">{user.email ?? 'Not Provided'}</p>
                 </div>
                 {/* <Button variant="outline" size="sm" className="mt-4" disabled>Edit Profile (soon)</Button> */}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Settings Tab Content */}
          <TabsContent value="account">
            <Card className="border border-border">
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your account settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 <Card className="border-destructive/50 bg-destructive/10">
                    <CardHeader>
                        <CardTitle className="text-destructive text-lg">Delete Account</CardTitle>
                        <CardDescription className="text-destructive/90">
                           Permanently delete your account and all associated data. This action cannot be undone.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="destructive" disabled> {/* Add onClick handler later */}
                           Delete My Account
                        </Button>
                    </CardContent>
                 </Card>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

type MonthlyBucket = {
  label: string;
  sessions: number;
  totalMinutes: number;
  avgWpm: number;
  heightPercent: number;
};

function buildYearlyActivity(results: Pick<Result, "createdAt" | "duration" | "wpm">[]): MonthlyBucket[] {
  type DraftBucket = {
    key: string;
    label: string;
    sessions: number;
    totalMinutes: number;
    wpmSum: number;
  };
  const now = new Date();
  const buckets: DraftBucket[] = Array.from({ length: 12 }).map((_, idx) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (11 - idx), 1);
    const label = date.toLocaleString("en-US", { month: "short" });
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label,
      sessions: 0,
      totalMinutes: 0,
      wpmSum: 0,
    };
  });

  results.forEach((res) => {
    const diffMonths =
      (res.createdAt.getFullYear() - now.getFullYear()) * 12 +
      (res.createdAt.getMonth() - now.getMonth());
    if (diffMonths < -11 || diffMonths > 0) return;
    const bucketIndex = 11 + diffMonths;
    const bucket = buckets[bucketIndex];
    bucket.sessions += 1;
    bucket.totalMinutes += (res.duration ?? 0) / 60;
    bucket.wpmSum += res.wpm;
  });

  const maxSessions = Math.max(...buckets.map((b) => b.sessions), 1);

  return buckets.map((b) => ({
    label: b.label,
    sessions: b.sessions,
    totalMinutes: b.totalMinutes,
    avgWpm: b.sessions ? b.wpmSum / b.sessions : 0,
    heightPercent: b.sessions ? Math.max(6, (b.sessions / maxSessions) * 100) : 4,
  }));
}

function summarizeTotals(buckets: MonthlyBucket[]) {
  const totalSessions = buckets.reduce((sum, b) => sum + b.sessions, 0);
  const totalMinutes = buckets.reduce((sum, b) => sum + b.totalMinutes, 0);
  const wpmWeightedSum = buckets.reduce((sum, b) => sum + b.avgWpm * b.sessions, 0);
  const avgWpm = totalSessions ? wpmWeightedSum / totalSessions : 0;
  const mostActive = buckets.reduce(
    (max, b) => (b.sessions > (max?.sessions ?? 0) ? b : max),
    undefined as MonthlyBucket | undefined,
  );
  const bestWpm = buckets.reduce(
    (max, b) => (b.avgWpm > (max?.avgWpm ?? 0) && b.sessions > 0 ? b : max),
    undefined as MonthlyBucket | undefined,
  );

  return {
    totalSessions,
    totalMinutes,
    avgWpm,
    mostActiveMonth: mostActive?.sessions ? `${mostActive.label} (${mostActive.sessions})` : null,
    bestWpmMonth: bestWpm,
  };
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/20 px-3 py-1 text-xs text-muted-foreground">
      <span className="font-medium text-foreground">{value}</span>
      <span>{label}</span>
    </span>
  );
}

type ContributionGrid = {
  weeks: { date: string; dateLabel: string; count: number }[][];
  monthLabels: (string | null)[];
};

function buildContributionGrid(results: Pick<Result, "createdAt">[]): ContributionGrid {
  const today = new Date();
  const days = 7 * 53; // 53 weeks shown similar to GitHub
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  const countsByDate = new Map<string, number>();
  results.forEach((r) => {
    const key = r.createdAt.toISOString().slice(0, 10);
    countsByDate.set(key, (countsByDate.get(key) ?? 0) + 1);
  });

  const weeks: ContributionGrid["weeks"] = [];
  let currentWeek: ContributionGrid["weeks"][number] = [];
  for (let i = 0; i < days; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const key = date.toISOString().slice(0, 10);
    const count = countsByDate.get(key) ?? 0;
    const cell = {
      date: key,
      dateLabel: date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      count,
    };
    currentWeek.push(cell);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);

  // Month labels for the top, similar to GitHub: only show when month changes.
  const monthLabels: (string | null)[] = [];
  let lastMonth: number | null = null;
  weeks.forEach((week) => {
    const firstDay = week[0];
    const d = new Date(firstDay.date);
    const month = d.getMonth();
    if (month !== lastMonth) {
      monthLabels.push(
        d.toLocaleString("en-US", {
          month: "short",
        }),
      );
      lastMonth = month;
    } else {
      monthLabels.push(null);
    }
  });

  return { weeks, monthLabels };
}

function contributionClass(count: number) {
  if (count === 0) return "bg-[rgb(31,41,55)]";
  if (count === 1) return "bg-amber-600 border border-amber-400";
  if (count <= 3) return "bg-amber-500 border border-amber-300";
  if (count <= 6) return "bg-amber-400 border border-amber-200";
  if (count <= 9) return "bg-amber-300 border border-amber-100";
  return "bg-amber-200 border border-amber-100";
}