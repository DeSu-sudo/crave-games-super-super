import { Link, useLocation } from "wouter";
import { Home, Shuffle, Heart, Gamepad2, Store, LogIn, UserPlus, LogOut, LayoutGrid, Menu, X, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Category, User } from "@shared/schema";

interface AppSidebarProps {
  categories: Category[];
  currentUser: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AppSidebar({ categories, currentUser, isOpen, onClose }: AppSidebarProps) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/random", label: "Random Game", icon: Shuffle },
  ];

  const authItems = currentUser
    ? [{ href: "/favorites", label: "Favorites", icon: Heart }]
    : [];

  const adminItems = [{ href: "/admin", label: "Admin Panel", icon: Shield }];

  return (
    <>
      {/* Mobile overlay backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        data-testid="sidebar-overlay"
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-[280px] md:w-60 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 ease-out md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        data-testid="sidebar"
      >
        {/* Header with logo and close button */}
        <div className="flex items-center justify-between p-4 md:p-5">
          <Link href="/" onClick={onClose}>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              CraveGames
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onClose}
            data-testid="button-close-sidebar"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Scrollable navigation */}
        <ScrollArea className="flex-1 px-3">
          <nav className="flex flex-col gap-1">
            {/* Main navigation */}
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={onClose}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground transition-colors hover-elevate cursor-pointer min-h-[44px]",
                    location === item.href && "bg-sidebar-accent text-sidebar-accent-foreground"
                  )}
                  data-testid={`nav-${item.label.toLowerCase().replace(" ", "-")}`}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </div>
              </Link>
            ))}

            {/* Auth-specific items */}
            {authItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={onClose}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground transition-colors hover-elevate cursor-pointer min-h-[44px]",
                    location === item.href && "bg-sidebar-accent text-sidebar-accent-foreground"
                  )}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </div>
              </Link>
            ))}

            {/* Admin Panel */}
            {adminItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={onClose}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground transition-colors hover-elevate cursor-pointer min-h-[44px]",
                    location === item.href && "bg-sidebar-accent text-sidebar-accent-foreground"
                  )}
                  data-testid={`nav-${item.label.toLowerCase().replace(" ", "-")}`}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </div>
              </Link>
            ))}

            {/* Divider */}
            <div className="h-px bg-sidebar-border my-2" />

            {/* Categories */}
            {categories.map((category) => (
              <Link key={category.id} href={`/category/${category.name}`} onClick={onClose}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground transition-colors hover-elevate cursor-pointer min-h-[44px]",
                    location === `/category/${category.name}` && "bg-sidebar-accent text-sidebar-accent-foreground"
                  )}
                  data-testid={`nav-category-${category.id}`}
                >
                  <Gamepad2 className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium">{category.name}</span>
                </div>
              </Link>
            ))}

            {/* Divider */}
            <div className="h-px bg-sidebar-border my-2" />

            {/* Store */}
            <Link href="/store" onClick={onClose}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground transition-colors hover-elevate cursor-pointer min-h-[44px]",
                  location === "/store" && "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
                data-testid="nav-store"
              >
                <Store className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium">Store</span>
              </div>
            </Link>

            {/* Auth links for non-logged in users */}
            {!currentUser && (
              <>
                <div className="h-px bg-sidebar-border my-2" />
                <Link href="/login" onClick={onClose}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground transition-colors hover-elevate cursor-pointer min-h-[44px]",
                      location === "/login" && "bg-sidebar-accent text-sidebar-accent-foreground"
                    )}
                    data-testid="nav-login"
                  >
                    <LogIn className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">Login</span>
                  </div>
                </Link>
                <Link href="/register" onClick={onClose}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground transition-colors hover-elevate cursor-pointer min-h-[44px]",
                      location === "/register" && "bg-sidebar-accent text-sidebar-accent-foreground"
                    )}
                    data-testid="nav-register"
                  >
                    <UserPlus className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">Register</span>
                  </div>
                </Link>
              </>
            )}
          </nav>
        </ScrollArea>

        {/* User info footer */}
        {currentUser && (
          <div className="p-3 border-t border-sidebar-border">
            <div className="flex items-center gap-3 p-2">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage src="/placeholder-avatar.png" alt={currentUser.username} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {currentUser.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-semibold truncate flex-1">{currentUser.username}</span>
              <Link href="/inventory" onClick={onClose}>
                <Button variant="ghost" size="icon" title="My Collection" data-testid="button-inventory">
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                size="icon" 
                title="Logout" 
                data-testid="button-logout"
                onClick={async () => {
                  await apiRequest("POST", "/api/logout");
                  queryClient.invalidateQueries({ queryKey: ["/api/me"] });
                  onClose();
                  window.location.href = "/";
                }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="md:hidden min-h-[44px] min-w-[44px]"
      onClick={onClick}
      data-testid="button-menu"
    >
      <Menu className="h-6 w-6" />
    </Button>
  );
}
