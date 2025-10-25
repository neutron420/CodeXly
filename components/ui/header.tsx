// components/ui/header.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Import Dropdown components
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"; // Import Avatar components
import { Menu, MoveRight, X, User as UserIcon, LogOut } from "lucide-react"; // Added UserIcon, LogOut
import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react"; // Import hooks

function Header1() {
    const { data: session, status } = useSession(); // Get session status
    const navigationItems = [
        {
            title: "Home",
            href: "/",
            description: "",
        },
        { // Example dropdown item
            title: "Product",
            description: "Explore our features.",
            items: [
                { title: "Code Generation", href: "/features/generation" },
                { title: "Explanation", href: "/features/explanation" },
                { title: "Optimization", href: "/features/optimization" },
            ],
        },
        {
            title: "About",
            href: "/about", // Direct link to about page
            description: "",
        },
        // Add other navigation items as needed
    ];

    const [isOpen, setOpen] = useState(false);

    // Function to get initials from name for Avatar Fallback
    const getInitials = (name?: string | null): string => {
        if (!name) return '?';
        const names = name.split(' ');
        if (names.length === 1) return names[0]?.[0]?.toUpperCase() ?? '?'; // Handle empty string case
        return ((names[0]?.[0] ?? '') + (names[names.length - 1]?.[0] ?? '')).toUpperCase(); // Handle cases with only one name part or empty strings
    };


    return (
        <header className="w-full z-40 fixed top-0 left-0 bg-transparent backdrop-blur-sm border-b border-border/40"> {/* Added subtle border */}
            <div className="container relative mx-auto min-h-20 flex gap-4 flex-row lg:grid lg:grid-cols-3 items-center">
                {/* --- Left Navigation --- */}
                <div className="justify-start items-center gap-2 lg:flex hidden flex-row"> {/* Reduced gap */}
                    <NavigationMenu className="flex justify-start items-start">
                        <NavigationMenuList className="flex justify-start gap-1 flex-row"> {/* Reduced gap */}
                            {navigationItems.map((item) => (
                                <NavigationMenuItem key={item.title}>
                                    {item.href ? (
                                        <Link href={item.href} legacyBehavior passHref>
                                            <NavigationMenuLink asChild>
                                                {/* Adjusted Button variant/styling */}
                                                <Button variant="ghost" className="text-sm font-medium text-white/80 hover:text-white hover:bg-white/10">
                                                    {item.title}
                                                </Button>
                                            </NavigationMenuLink>
                                        </Link>
                                    ) : (
                                        <>
                                            <NavigationMenuTrigger className="text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 bg-transparent focus:bg-white/10 data-active:bg-white/10 data-[state=open]:bg-white/10">
                                                {item.title}
                                            </NavigationMenuTrigger>
                                            <NavigationMenuContent className="w-[450px]! p-4 bg-popover text-popover-foreground border border-border">
                                                <div className="flex flex-col lg:grid grid-cols-2 gap-4">
                                                    <div className="flex flex-col h-full justify-between">
                                                        <div className="flex flex-col">
                                                            <p className="text-base font-semibold">{item.title}</p> {/* Made title bold */}
                                                            <p className="text-muted-foreground text-sm mt-1">
                                                                {item.description}
                                                            </p>
                                                        </div>
                                                        {/* Optional Button inside dropdown */}
                                                        {/* <Button size="sm" className="mt-10"> Learn More </Button> */}
                                                    </div>
                                                    <div className="flex flex-col text-sm h-full justify-end">
                                                        {item.items?.map((subItem) => (
                                                            <Link href={subItem.href} legacyBehavior passHref key={subItem.title}>
                                                                <NavigationMenuLink asChild>
                                                                    <a className="flex flex-row justify-between items-center hover:bg-muted py-2 px-4 rounded">
                                                                        <span>{subItem.title}</span>
                                                                        <MoveRight className="w-4 h-4 text-muted-foreground" />
                                                                    </a>
                                                                </NavigationMenuLink>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </div>
                                            </NavigationMenuContent>
                                        </>
                                    )}
                                </NavigationMenuItem>
                            ))}
                        </NavigationMenuList>
                    </NavigationMenu>
                </div>
                {/* --- End Left Navigation --- */}

                {/* --- Center Logo --- */}
                <div className="flex lg:justify-center">
                   <Link href="/" className="font-semibold text-white text-lg"> {/* Added Link and size */}
                      CodeXly
                   </Link>
                </div>
                {/* --- End Center Logo --- */}

                {/* --- Right Side: Auth Status / Profile Dropdown --- */}
                <div className="flex justify-end w-full gap-4 items-center">
                   {status === "loading" ? (
                     <div className="h-10 w-10 rounded-full bg-muted/50 animate-pulse"></div> // Skeleton loader for avatar size
                   ) : session?.user ? (
                      // --- Logged In State: Dropdown ---
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="relative h-10 w-10 rounded-full focus-visible:ring-0 focus-visible:ring-offset-0 p-0"> {/* Remove padding */}
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={session.user.image ?? undefined} alt={session.user.name ?? session.user.email ?? 'User'} />
                              <AvatarFallback className="bg-primary text-primary-foreground text-xs"> {/* Smaller text */}
                                {getInitials(session.user.name)}
                              </AvatarFallback>
                            </Avatar>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                          <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                              <p className="text-sm font-medium leading-none truncate"> {/* Added truncate */}
                                {session.user.name ?? 'User Profile'}
                              </p>
                              <p className="text-xs leading-none text-muted-foreground truncate"> {/* Added truncate */}
                                {session.user.email}
                              </p>
                            </div>
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                             <Link href="/profile">
                               <UserIcon className="mr-2 h-4 w-4" />
                               <span>Profile</span>
                             </Link>
                          </DropdownMenuItem>
                          {/* Add other items like Settings if needed */}
                          {/* <DropdownMenuItem disabled>Settings (soon)</DropdownMenuItem> */}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => signOut()} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      // --- End Logged In State ---
                   ) : (
                      // --- Logged Out State ---
                      <>
                        <Button variant="ghost" className="hidden md:inline text-white/80 hover:text-white hover:bg-white/10 text-sm" asChild>
                          <Link href="/signin">Sign in</Link>
                        </Button>
                        {/* <div className="border-r border-white/20 hidden md:inline h-6"></div> */}
                        <Button className="text-sm" asChild>
                          <Link href="/signup">Get started</Link>
                        </Button>
                      </>
                      // --- End Logged Out State ---
                    )}
                </div>
                {/* --- End Auth Status --- */}

                {/* --- Mobile Menu --- */}
                <div className="flex w-12 shrink lg:hidden items-end justify-end">
                    <Button variant="ghost" onClick={() => setOpen(!isOpen)} className="text-white hover:text-white hover:bg-white/10">
                        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </Button>
                    {isOpen && (
                        <div className="absolute top-20 border-t border-border flex flex-col w-full right-0 bg-background shadow-lg py-4 container gap-8">
                            {/* Mobile Navigation Items */}
                            {navigationItems.map((item) => (
                                <div key={item.title}>
                                    <div className="flex flex-col gap-2">
                                        {item.href ? (
                                            <Link
                                                href={item.href}
                                                className="flex justify-between items-center py-1" // Added padding
                                                onClick={() => setOpen(false)}
                                            >
                                                <span className="text-lg font-medium">{item.title}</span> {/* Made text larger/bolder */}
                                                {/* <MoveRight className="w-4 h-4 stroke-1 text-muted-foreground" /> */}
                                            </Link>
                                        ) : (
                                            <p className="text-lg font-semibold pt-2">{item.title}</p> // Added padding top
                                        )}
                                        {item.items &&
                                            item.items.map((subItem) => (
                                                <Link
                                                    key={subItem.title}
                                                    href={subItem.href}
                                                    className="flex justify-between items-center pl-4 py-1" // Indent sub-items, added padding
                                                    onClick={() => setOpen(false)}
                                                >
                                                    <span className="text-muted-foreground">
                                                        {subItem.title}
                                                    </span>
                                                    {/* <MoveRight className="w-4 h-4 stroke-1" /> */}
                                                </Link>
                                            ))}
                                    </div>
                                </div>
                            ))}
                             {/* Mobile Auth/Profile Actions */}
                             <div className="border-t border-border pt-6 flex flex-col gap-4">
                                {status === "loading" ? (
                                  <span className="text-sm text-muted-foreground px-4">Loading user...</span>
                                ) : session?.user ? (
                                   <>
                                     <div className="flex items-center gap-3 px-4 mb-2">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={session.user.image ?? undefined} alt={session.user.name ?? 'User'} />
                                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                                {getInitials(session.user.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium truncate">{session.user.name ?? 'User'}</span>
                                            <span className="text-xs text-muted-foreground truncate">{session.user.email}</span>
                                        </div>
                                     </div>
                                     <Button variant="ghost" asChild onClick={() => setOpen(false)} className="justify-start">
                                       <Link href="/profile">
                                          <UserIcon className="mr-2 h-4 w-4"/> Profile
                                       </Link>
                                     </Button>
                                     <Button variant="outline" onClick={() => { signOut(); setOpen(false); }}>
                                        <LogOut className="mr-2 h-4 w-4"/> Sign Out
                                     </Button>
                                   </>
                                ) : (
                                   <>
                                     <Button variant="outline" asChild onClick={() => setOpen(false)}>
                                       <Link href="/signin">Sign in</Link>
                                     </Button>
                                     <Button asChild onClick={() => setOpen(false)}>
                                       <Link href="/signup">Get started</Link>
                                     </Button>
                                   </>
                                 )}
                             </div>
                        </div>
                    )}
                </div>
                {/* --- End Mobile Menu --- */}
            </div>
        </header>
    );
}

export { Header1 };