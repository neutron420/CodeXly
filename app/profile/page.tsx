
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { Header1 } from "@/components/ui/header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; 
import { Progress } from "@/components/ui/progress"; 
import prisma from "@/lib/prisma"; 
import { type UserLanguageStats, type LanguageName } from "@prisma/client"; 
import { BarChart, Clock, Percent, Zap, User as UserIcon, Settings, Activity } from "lucide-react"; // Icons
import { Button } from "@/components/ui/button"; 

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
  try {
      languageStats = await prisma.userLanguageStats.findMany({
          where: { userId: user.id },
          orderBy: {
              updatedAt: 'desc',
          },
      });
  } catch (error) {
      console.error("Failed to fetch language stats:", error);
      // You could pass an error state to the client component if needed
  }

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