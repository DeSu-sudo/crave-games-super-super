import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Heart, Maximize, Star, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { GameCard } from "@/components/games/GameCard";
import type { Game, CommentWithUser, User } from "@shared/schema";

interface GameDetailData {
  game: Game;
  comments: CommentWithUser[];
  relatedGames: Game[];
  isFavorite: boolean;
  userRating: number | null;
}

export default function GameDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [commentText, setCommentText] = useState("");
  const [hoverRating, setHoverRating] = useState(0);

  const { data: currentUser } = useQuery<User | null>({
    queryKey: ["/api/me"],
  });

  const { data, isLoading } = useQuery<GameDetailData>({
    queryKey: ["/api/game", id],
  });

  const favoriteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/favorite/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/game", id] });
    },
  });

  const rateMutation = useMutation({
    mutationFn: async (rating: number) => {
      return apiRequest("POST", `/api/rate/${id}`, { rating });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/game", id] });
      toast({ title: "Thanks for rating!" });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", `/api/comment/${id}`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/game", id] });
      setCommentText("");
    },
  });

  // Load Ruffle script for Flash games
  useEffect(() => {
    if (data?.game?.type === "flash") {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/@nicebear2003/ruffle@1.0.0/dist/ruffle.js";
      script.async = true;
      document.head.appendChild(script);
      return () => {
        document.head.removeChild(script);
      };
    }
  }, [data?.game?.type]);

  const handleFullscreen = () => {
    const iframe = document.getElementById("gameFrame") as HTMLIFrameElement;
    if (iframe) {
      iframe.requestFullscreen?.();
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto">
        <Skeleton className="w-full aspect-video rounded-xl mb-4" />
        <Skeleton className="h-12 w-full max-w-md mb-6" />
        <div className="flex gap-4">
          <Skeleton className="h-24 w-24 rounded-lg" />
          <div className="flex-1">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-6 w-48" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Game not found.</p>
      </div>
    );
  }

  const { game, comments, relatedGames, isFavorite, userRating } = data;
  const displayRating = hoverRating || userRating || Math.round(game.averageRating);

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Game Player Section */}
      <div className="max-w-5xl mx-auto">
        {/* Game Frame */}
        <div className="relative w-full aspect-video bg-card rounded-xl overflow-hidden border border-border">
          {game.type === "flash" ? (
            <object
              id="gameFrame"
              type="application/x-shockwave-flash"
              data={game.iframeUrl || ""}
              className="w-full h-full"
              data-testid="game-flash"
            >
              <param name="allowFullScreen" value="true" />
              <param name="allowScriptAccess" value="always" />
              <p className="text-muted-foreground text-center p-4">
                Flash content is loading...
              </p>
            </object>
          ) : (
            <iframe
              id="gameFrame"
              src={game.iframeUrl || ""}
              className="w-full h-full"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin"
              data-testid="game-iframe"
            />
          )}
        </div>

        {/* Player Bar */}
        <div className="flex items-center justify-between gap-4 mt-3 px-1">
          <h1 className="text-lg md:text-xl font-bold truncate">{game.name}</h1>
          <div className="flex items-center gap-2 flex-shrink-0">
            {currentUser && (
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "min-h-[44px] min-w-[44px]",
                  isFavorite && "text-red-500"
                )}
                onClick={() => favoriteMutation.mutate()}
                disabled={favoriteMutation.isPending}
                data-testid="button-favorite"
              >
                <Heart className={cn("h-5 w-5", isFavorite && "fill-current")} />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="min-h-[44px] min-w-[44px]"
              onClick={handleFullscreen}
              data-testid="button-fullscreen"
            >
              <Maximize className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Game Info */}
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row gap-4 p-4 bg-card rounded-xl border border-card-border">
          <img
            src={game.thumbnailUrl}
            alt={game.name}
            className="w-24 h-18 sm:w-28 sm:h-21 rounded-lg object-cover flex-shrink-0"
          />
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-2">{game.name}</h2>
            {/* Rating */}
            <div className="flex items-center gap-2">
              <div 
                className="flex gap-1"
                onMouseLeave={() => setHoverRating(0)}
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    className={cn(
                      "p-0.5 transition-colors",
                      currentUser ? "cursor-pointer" : "cursor-default"
                    )}
                    onMouseEnter={() => currentUser && setHoverRating(star)}
                    onClick={() => currentUser && rateMutation.mutate(star)}
                    disabled={!currentUser || rateMutation.isPending}
                    data-testid={`star-${star}`}
                  >
                    <Star
                      className={cn(
                        "h-5 w-5 transition-colors",
                        star <= displayRating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground"
                      )}
                    />
                  </button>
                ))}
              </div>
              {currentUser ? (
                <span className="text-sm text-muted-foreground">
                  {game.averageRating.toFixed(1)}/5 ({game.ratingCount} ratings)
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Log in to rate
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mt-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">About {game.name}</h3>
            <p className="text-muted-foreground">
              {game.description || "No description available for this game."}
            </p>
          </div>
          {game.instructions && (
            <div>
              <h3 className="text-lg font-semibold mb-2">How to Play</h3>
              <p className="text-muted-foreground">{game.instructions}</p>
            </div>
          )}
        </div>
      </div>

      {/* Comments Section */}
      <div className="max-w-5xl mx-auto">
        <div className="bg-card rounded-xl border border-card-border p-4 md:p-6">
          <h3 className="text-lg font-semibold mb-4">Comments</h3>

          {/* Comment Form */}
          {currentUser ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (commentText.trim()) {
                  commentMutation.mutate(commentText);
                }
              }}
              className="mb-6"
            >
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="mb-3 min-h-[80px]"
                data-testid="input-comment"
              />
              <Button
                type="submit"
                disabled={!commentText.trim() || commentMutation.isPending}
                className="gap-2"
                data-testid="button-post-comment"
              >
                <Send className="h-4 w-4" />
                Post Comment
              </Button>
            </form>
          ) : (
            <p className="text-muted-foreground mb-6">
              <a href="/login" className="text-primary hover:underline">Log in</a> to post a comment.
            </p>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No comments yet. Be the first!</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3" data-testid={`comment-${comment.id}`}>
                  <Avatar className="h-9 w-9 flex-shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {comment.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{comment.username}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/90 break-words">{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Related Games */}
      {relatedGames.length > 0 && (
        <div className="max-w-5xl mx-auto">
          <h3 className="text-lg font-semibold mb-4">More Games</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
            {relatedGames.slice(0, 8).map((relatedGame) => (
              <GameCard key={relatedGame.id} game={relatedGame} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
