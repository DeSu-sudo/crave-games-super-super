import { useState } from "react";
import { Switch, Route } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar, MobileMenuButton } from "@/components/layout/AppSidebar";
import { Header } from "@/components/layout/Header";
import Home from "@/pages/Home";
import Category from "@/pages/Category";
import GameDetail from "@/pages/GameDetail";
import Store from "@/pages/Store";
import Inventory from "@/pages/Inventory";
import Favorites from "@/pages/Favorites";
import MakeMore from "@/pages/MakeMore";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/not-found";
import type { Category as CategoryType, Game, UserWithAvatar } from "@shared/schema";

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: currentUser } = useQuery<UserWithAvatar | null>({
    queryKey: ["/api/me"],
  });

  const { data: categories } = useQuery<CategoryType[]>({
    queryKey: ["/api/categories"],
  });

  const { data: games } = useQuery<Game[]>({
    queryKey: ["/api/games"],
  });

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <AppSidebar
        categories={categories || []}
        currentUser={currentUser || null}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Spacer for desktop sidebar - prevents overlap */}
      <div className="hidden md:block w-60 flex-shrink-0" />

      {/* Main content area */}
      <div className="flex-1 min-h-screen flex flex-col min-w-0">
        {/* Header */}
        <Header
          currentUser={currentUser || null}
          games={games || []}
          menuButton={<MobileMenuButton onClick={() => setSidebarOpen(true)} />}
        />

        {/* Main content */}
        <main className="flex-1 p-3 md:p-4 lg:p-5">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/category/:name" component={Category} />
            <Route path="/game/:id" component={GameDetail} />
            <Route path="/store" component={Store} />
            <Route path="/inventory" component={Inventory} />
            <Route path="/favorites" component={Favorites} />
            <Route path="/make-more" component={MakeMore} />
            <Route path="/login" component={Login} />
            <Route path="/register" component={Register} />
            <Route path="/admin" component={Admin} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
