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
import { BarChart, Clock, Percent, Zap, User as UserIcon, Settings, Activity } from "lucide-react"; // Icons
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

    // Pull only this user's results for the contribution heatmap
    yearlyResults = await prisma.result.findMany({
      where: {
        userId: user.id, // Only fetch current user's results
      },
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
      <div className="container mx-auto px-4 sm:px-6 pt-20 sm:pt-28 pb-8 sm:pb-16">

        {/* Profile Header Card */}
        <Card className="mb-6 sm:mb-8 overflow-hidden border border-border shadow-sm">
          <CardHeader className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 p-4 sm:p-6 bg-card">
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-2 border-primary flex-shrink-0">
              <AvatarImage src={user.image ?? undefined} alt={user.name ?? 'User'} />
              <AvatarFallback className="text-xl sm:text-2xl bg-primary/80 text-primary-foreground">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-center sm:text-left w-full sm:w-auto">
                <CardTitle className="text-xl sm:text-2xl">{user.name ?? 'User Profile'}</CardTitle>
                <CardDescription className="text-sm break-all sm:break-normal">{user.email}</CardDescription>
            </div>
          </CardHeader>
        </Card>

        <Card className="mb-6 sm:mb-8 border border-border/70 shadow-lg bg-gradient-to-br from-card/95 to-card/90 backdrop-blur-sm overflow-visible">
          <CardHeader className="flex flex-col gap-3 sm:gap-2 sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 bg-gradient-to-r from-card/50 to-transparent border-b border-border/30">
            <div>
              <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Practice Contribution Graph
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">
                Your coding practice activity over the last year
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs">
              <span className="text-muted-foreground font-medium">Less</span>
              <div className="flex items-center gap-1">
                <span className="inline-block h-3 w-3 rounded-sm bg-[#161b22] border border-[#30363d] transition-transform hover:scale-110" />
                <span className="inline-block h-3 w-3 rounded-sm bg-[#0e4429] border border-[#1a7f37] transition-transform hover:scale-110" />
                <span className="inline-block h-3 w-3 rounded-sm bg-[#006d32] border border-[#238636] transition-transform hover:scale-110" />
                <span className="inline-block h-3 w-3 rounded-sm bg-[#26a641] border border-[#2ea043] transition-transform hover:scale-110" />
                <span className="inline-block h-3 w-3 rounded-sm bg-[#39d353] border border-[#3fc653] transition-transform hover:scale-110" />
                <span className="inline-block h-3 w-3 rounded-sm bg-[#56d364] border border-[#56d364] transition-transform hover:scale-110" />
              </div>
              <span className="text-muted-foreground font-medium">More</span>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 pt-4 sm:pt-6 overflow-visible">
            <div className="overflow-x-auto overflow-y-visible pb-8">
              {contributions.weeks.length === 0 ? (
                <div className="py-8 sm:py-10 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
                    <Activity className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    No saved practice yet. Complete a run and hit <span className="font-semibold text-foreground">Save</span> to start filling this grid.
                  </p>
                </div>
              ) : (
                <>
                  {/* Summary Stats */}
                  <div className="mb-4 sm:mb-5 p-3 sm:p-4 rounded-lg bg-muted/30 border border-border/50 flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="text-muted-foreground">Total contributions:</span>
                      <span className="font-semibold text-foreground">
                        {yearlyResults.length} {yearlyResults.length === 1 ? 'session' : 'sessions'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-amber-500" />
                      <span className="text-muted-foreground">Longest streak:</span>
                      <span className="font-semibold text-foreground">
                        {calculateLongestStreak(contributions.weeks)} {calculateLongestStreak(contributions.weeks) === 1 ? 'day' : 'days'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      <span className="text-muted-foreground">This year:</span>
                      <span className="font-semibold text-foreground">
                        {new Date().getFullYear()}
                      </span>
                    </div>
                  </div>

                  {/* Month Labels */}
                  <div className="ml-6 sm:ml-8 mb-2 sm:mb-3 flex gap-[2px] sm:gap-[3px] text-[9px] sm:text-[10px] text-muted-foreground font-medium min-w-fit">
                    {contributions.monthLabels.map((label, idx) => (
                      <span 
                        key={idx} 
                        className="w-3.5 sm:w-4 text-center transition-opacity hover:opacity-100 hover:text-foreground flex-shrink-0"
                        style={{ minWidth: label ? 'auto' : '14px' }}
                      >
                        {label ?? ""}
                      </span>
                    ))}
                  </div>

                  {/* Contribution Grid */}
                  <div className="flex gap-[2px] sm:gap-[3px] relative min-w-fit">
                    {/* Day Labels */}
                    <div className="mr-1.5 sm:mr-2 flex flex-col justify-between py-1 text-[9px] sm:text-[10px] text-muted-foreground font-medium flex-shrink-0">
                      <span className="leading-none">Mon</span>
                      <span className="opacity-0 h-3.5 sm:h-4">Tue</span>
                      <span className="leading-none">Wed</span>
                      <span className="opacity-0 h-3.5 sm:h-4">Thu</span>
                      <span className="leading-none">Fri</span>
                      <span className="opacity-0 h-3.5 sm:h-4">Sat</span>
                      <span className="opacity-0 h-3.5 sm:h-4">Sun</span>
                    </div>
                    
                    {/* Weeks */}
                    <div className="flex gap-[2px] sm:gap-[3px]">
                      {contributions.weeks.map((week, idx) => (
                        <div key={idx} className="flex flex-col gap-[2px] sm:gap-[3px] group">
                          {week.map((day, dayIdx) => (
                            <div
                              key={day.date}
                              className={`h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-[3px] transition-all duration-300 cursor-pointer relative group/cell ${contributionClass(day.count)}`}
                              title={`${day.dateLabel}: ${day.count} practice session${day.count === 1 ? "" : "s"}`}
                              style={{
                                animationDelay: `${(idx * 7 + dayIdx) * 10}ms`,
                              }}
                            >
                              {/* Enhanced Tooltip on hover - positioned to avoid clipping */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground text-[11px] rounded-md shadow-xl opacity-0 group-hover/cell:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-[9999] border border-border/50 backdrop-blur-sm transform">
                                <div className="font-semibold text-foreground mb-1">{day.dateLabel}</div>
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <span className="inline-block h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
                                  <span>
                                    {day.count} {day.count === 1 ? 'practice session' : 'practice sessions'}
                                  </span>
                                </div>
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-popover" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                {/* Footer Info */}
                <div className="mt-4 pt-3 border-t border-border/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    <span className="font-medium">Note:</span> Data based on saved practice results; unsaved runs are not counted.
                  </p>
                  <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      Active
                    </span>
                  </div>
                </div>
              </>
            )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Profile Sections */}
        <Tabs defaultValue="stats" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6 h-auto">
            <TabsTrigger value="stats" className="text-xs sm:text-sm py-2 sm:py-3">
                <Activity className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Language </span>Stats
            </TabsTrigger>
            <TabsTrigger value="profile" className="text-xs sm:text-sm py-2 sm:py-3">
                 <UserIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Profile </span>Details
            </TabsTrigger>
            <TabsTrigger value="account" className="text-xs sm:text-sm py-2 sm:py-3">
                <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> Account
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {languageStats.map((stat) => (
                      <Card key={stat.id} className="flex flex-col border border-border/50">
                        <CardHeader className="pb-2 sm:pb-3 p-4 sm:p-6">
                          <CardTitle className="text-base sm:text-lg">{formatLanguageName(stat.languageName)}</CardTitle>
                          {/* <CardDescription>Last Practiced: {new Date(stat.updatedAt).toLocaleDateString()}</CardDescription> */}
                        </CardHeader>
                        <CardContent className="flex-grow space-y-3 sm:space-y-4 pt-0 px-4 sm:px-6 pb-4 sm:pb-6">
                           <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
                                    <span className="flex items-center"><Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5"/> Average WPM</span>
                                    <span className="font-semibold text-foreground text-xs sm:text-sm">{stat.averageWpm.toFixed(1)}</span>
                                </div>
                           </div>

                           <div className="space-y-1">
                               <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground mb-1">
                                    <span className="flex items-center"><Percent className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5"/> Average Accuracy</span>
                                    <span className="font-semibold text-foreground text-xs sm:text-sm">{stat.averageAccuracy.toFixed(1)}%</span>
                               </div>
                               <Progress value={stat.averageAccuracy} className="h-1.5 sm:h-2" />
                           </div>

                           <div className="flex items-center justify-between text-xs sm:text-sm">
                                <span className="flex items-center text-muted-foreground"><BarChart className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5"/> Snippets Done</span>
                                <span className="font-medium text-foreground">{stat.snippetsCompleted}</span>
                           </div>
                           <div className="flex items-center justify-between text-xs sm:text-sm">
                                <span className="flex items-center text-muted-foreground"><Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 text-amber-500"/> Best WPM</span>
                                <span className="font-medium text-amber-500">{stat.bestWpm.toFixed(1)}</span>
                           </div>
                             <div className="flex items-center justify-between text-xs sm:text-sm pt-2 border-t border-border/50">
                                <span className="flex items-center text-muted-foreground"><Clock className="w-3 h-3 mr-1 sm:mr-1.5"/> Last Practice</span>
                                <span className="font-medium text-foreground">{new Date(stat.updatedAt).toLocaleDateString()}</span>
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
  // Enhanced GitHub-style contribution colors with smooth transitions and better hover effects
  if (count === 0) {
    return "bg-[#161b22] border border-[#30363d] hover:border-[#484f58] hover:bg-[#21262d] hover:scale-110 hover:shadow-sm hover:shadow-green-500/20";
  }
  if (count === 1) {
    return "bg-[#0e4429] border border-[#1a7f37] hover:border-[#238636] hover:bg-[#1a7f37] hover:scale-110 hover:shadow-md hover:shadow-green-500/30";
  }
  if (count <= 3) {
    return "bg-[#006d32] border border-[#238636] hover:border-[#2ea043] hover:bg-[#238636] hover:scale-110 hover:shadow-md hover:shadow-green-500/40";
  }
  if (count <= 6) {
    return "bg-[#26a641] border border-[#2ea043] hover:border-[#3fc653] hover:bg-[#2ea043] hover:scale-110 hover:shadow-lg hover:shadow-green-500/50";
  }
  if (count <= 9) {
    return "bg-[#39d353] border border-[#3fc653] hover:border-[#56d364] hover:bg-[#3fc653] hover:scale-110 hover:shadow-lg hover:shadow-green-500/60";
  }
  return "bg-[#56d364] border border-[#56d364] hover:border-[#7ee787] hover:bg-[#7ee787] hover:scale-110 hover:shadow-xl hover:shadow-green-500/70";
}

function calculateLongestStreak(weeks: ContributionGrid["weeks"]): number {
  let longestStreak = 0;
  let currentStreak = 0;

  // Flatten all days into a single array in chronological order
  const allDays: { date: string; count: number }[] = [];
  for (const week of weeks) {
    for (const day of week) {
      allDays.push({ date: day.date, count: day.count });
    }
  }

  // Calculate streak by checking consecutive days
  for (let i = 0; i < allDays.length; i++) {
    if (allDays[i].count > 0) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  // If we have any activity at all, ensure minimum streak is 1
  const hasAnyActivity = allDays.some(day => day.count > 0);
  if (hasAnyActivity && longestStreak === 0) {
    return 1;
  }

  return longestStreak;
}