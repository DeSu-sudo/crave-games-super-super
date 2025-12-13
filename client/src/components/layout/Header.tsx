import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { Search, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Game, UserWithAvatar } from "@shared/schema";

interface HeaderProps {
  currentUser: UserWithAvatar | null;
  games: Game[];
  menuButton?: React.ReactNode;
}

export function Header({ currentUser, games, menuButton }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [showCoinsMenu, setShowCoinsMenu] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const coinsRef = useRef<HTMLDivElement>(null);

  const filteredGames = games.filter((game) =>
    game.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 8);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
      if (coinsRef.current && !coinsRef.current.contains(event.target as Node)) {
        setShowCoinsMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 p-4 md:px-6 bg-background/80 backdrop-blur-xl border-b border-border">
      {/* Mobile menu button */}
      {menuButton}

      {/* Search container */}
      <div ref={searchRef} className="relative flex-1 max-w-lg mx-auto md:mx-0">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="Search for games..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(e.target.value.length > 0);
            }}
            onFocus={() => searchQuery.length > 0 && setShowResults(true)}
            className="pl-12 pr-4 h-12 md:h-11 bg-card border-border rounded-full text-base"
            data-testid="input-search"
          />
        </div>

        {/* Search results dropdown */}
        <div
          className={cn(
            "absolute top-full left-0 right-0 mt-2 bg-popover border border-popover-border rounded-xl overflow-hidden shadow-lg transition-all duration-200",
            showResults && filteredGames.length > 0
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-2 pointer-events-none"
          )}
        >
          <div className="max-h-80 overflow-y-auto p-2">
            {filteredGames.map((game) => (
              <Link key={game.id} href={`/game/${game.id}`}>
                <div
                  className="flex items-center gap-3 p-2 rounded-lg hover-elevate cursor-pointer"
                  onClick={() => {
                    setShowResults(false);
                    setSearchQuery("");
                  }}
                  data-testid={`search-result-${game.id}`}
                >
                  <img
                    src={game.thumbnailUrl}
                    alt={game.name}
                    className="w-12 h-9 rounded-md object-cover flex-shrink-0"
                  />
                  <span className="font-medium truncate">{game.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* No results message */}
        {showResults && searchQuery.length > 0 && filteredGames.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-popover-border rounded-xl p-6 text-center shadow-lg">
            <p className="text-muted-foreground italic">No games found</p>
          </div>
        )}
      </div>

      {/* Crave Coins */}
      <div ref={coinsRef} className="relative flex-shrink-0">
        <button
          onClick={() => setShowCoinsMenu(!showCoinsMenu)}
          className="flex items-center gap-2 bg-card border border-border rounded-full px-3 py-2 hover-elevate cursor-pointer min-h-[44px]"
          data-testid="button-coins"
        >
          <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-sm">
            C
          </div>
          <span className="font-semibold text-sm" data-testid="text-coin-balance">
            {currentUser ? currentUser.craveCoins.toLocaleString() : "0"}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Coins dropdown menu */}
        <div
          className={cn(
            "absolute top-full right-0 mt-2 w-40 bg-popover border border-popover-border rounded-xl overflow-hidden shadow-lg transition-all duration-200",
            showCoinsMenu
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-2 pointer-events-none"
          )}
        >
          <div className="p-2">
            {currentUser ? (
              <Link href="/make-more">
                <div
                  className="block px-4 py-3 text-center font-medium rounded-lg hover-elevate cursor-pointer"
                  onClick={() => setShowCoinsMenu(false)}
                  data-testid="link-make-more"
                >
                  Make More
                </div>
              </Link>
            ) : (
              <Link href="/login">
                <Button
                  className="w-full"
                  onClick={() => setShowCoinsMenu(false)}
                  data-testid="button-login-coins"
                >
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
