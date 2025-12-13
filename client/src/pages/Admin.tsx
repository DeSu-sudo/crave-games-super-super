import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Pencil, Trash2, Gamepad2, FolderOpen, ShoppingBag, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Game, Category, StoreItem, User } from "@shared/schema";

interface AdminData {
  games: Game[];
  categories: Category[];
  storeItems: StoreItem[];
}

function GameForm({ 
  game, 
  categories, 
  onSubmit, 
  onCancel 
}: { 
  game?: Game; 
  categories: Category[]; 
  onSubmit: (data: any) => void; 
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: game?.name || "",
    description: game?.description || "",
    instructions: game?.instructions || "",
    categoryId: game?.categoryId || "",
    thumbnailUrl: game?.thumbnailUrl || "",
    iframeUrl: game?.iframeUrl || "",
    htmlContent: (game as any)?.htmlContent || "",
    type: game?.type || "iframe",
    badge: game?.badge || "",
    isTrending: game?.isTrending || false,
  });
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingGame, setUploadingGame] = useState(false);
  const [gameFileName, setGameFileName] = useState("");

  const handleThumbnailUpload = async (file: File) => {
    setUploadingThumbnail(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      const response = await fetch("/api/admin/upload/thumbnail", {
        method: "POST",
        body: formDataUpload,
        credentials: "include",
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Upload failed");
      }
      const { url } = await response.json();
      setFormData((prev) => ({ ...prev, thumbnailUrl: url }));
      toast({ title: "Thumbnail uploaded!" });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleGameUpload = async (file: File) => {
    setUploadingGame(true);
    setGameFileName(file.name);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      const response = await fetch("/api/admin/upload/game", {
        method: "POST",
        body: formDataUpload,
        credentials: "include",
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Upload failed");
      }
      const { htmlContent } = await response.json();
      setFormData((prev) => ({ ...prev, htmlContent, type: "uploaded" }));
      toast({ title: "Game file uploaded!" });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setGameFileName("");
    } finally {
      setUploadingGame(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Game Name</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter game name"
            data-testid="input-game-name"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Category</Label>
          <Select value={formData.categoryId} onValueChange={(v) => setFormData({ ...formData, categoryId: v })}>
            <SelectTrigger data-testid="select-category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Game description"
          className="min-h-[60px]"
          data-testid="input-game-description"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Instructions</Label>
        <Textarea
          value={formData.instructions}
          onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
          placeholder="How to play"
          className="min-h-[60px]"
          data-testid="input-game-instructions"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Thumbnail</Label>
        <FileDropzone
          accept="image/*"
          variant="image"
          label="Drop thumbnail image or tap to browse"
          hint="JPG, PNG, GIF up to 10MB"
          preview={formData.thumbnailUrl || null}
          isUploading={uploadingThumbnail}
          onFileSelect={handleThumbnailUpload}
          onClear={() => setFormData((prev) => ({ ...prev, thumbnailUrl: "" }))}
        />
        <Input
          value={formData.thumbnailUrl}
          onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
          placeholder="Or enter URL directly"
          className="mt-2"
          data-testid="input-thumbnail-url"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Game Type</Label>
        <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
          <SelectTrigger data-testid="select-game-type">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="iframe">Iframe (External URL)</SelectItem>
            <SelectItem value="uploaded">Uploaded HTML Game</SelectItem>
            <SelectItem value="flash">Flash (Ruffle)</SelectItem>
            <SelectItem value="embed">Embed Code</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.type === "uploaded" ? (
        <div className="space-y-1">
          <Label className="text-xs">HTML Game File</Label>
          <FileDropzone
            accept=".html,.htm"
            variant="file"
            label="Drop HTML game file or tap to browse"
            hint="Single HTML file with embedded assets"
            uploadedFileName={gameFileName || (formData.htmlContent ? "Game uploaded" : undefined)}
            isUploading={uploadingGame}
            onFileSelect={handleGameUpload}
            onClear={() => {
              setFormData((prev) => ({ ...prev, htmlContent: "" }));
              setGameFileName("");
            }}
          />
        </div>
      ) : (
        <div className="space-y-1">
          <Label className="text-xs">Game URL / Embed Source</Label>
          <Input
            value={formData.iframeUrl}
            onChange={(e) => setFormData({ ...formData, iframeUrl: e.target.value })}
            placeholder="https://example.com/game or .swf URL for Flash"
            data-testid="input-game-url"
          />
          <p className="text-xs text-muted-foreground">
            For Iframe: Direct URL. For Flash: URL to .swf file.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Badge (optional)</Label>
          <Select value={formData.badge || "none"} onValueChange={(v) => setFormData({ ...formData, badge: v === "none" ? "" : v })}>
            <SelectTrigger data-testid="select-badge">
              <SelectValue placeholder="No badge" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Badge</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="hot">Hot</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3 pt-5">
          <Switch
            checked={formData.isTrending}
            onCheckedChange={(v) => setFormData({ ...formData, isTrending: v })}
            data-testid="switch-trending"
          />
          <Label className="text-xs">Trending</Label>
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button variant="outline" size="sm" onClick={onCancel} data-testid="button-cancel">
          Cancel
        </Button>
        <Button size="sm" onClick={() => onSubmit(formData)} data-testid="button-save-game">
          {game ? "Update Game" : "Add Game"}
        </Button>
      </div>
    </div>
  );
}

function CategoryForm({ 
  category, 
  onSubmit, 
  onCancel 
}: { 
  category?: Category; 
  onSubmit: (data: any) => void; 
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: category?.name || "",
    icon: category?.icon || "gamepad-2",
  });

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">Category Name</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter category name"
          data-testid="input-category-name"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Icon (Lucide icon name)</Label>
        <Input
          value={formData.icon}
          onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
          placeholder="gamepad-2"
          data-testid="input-category-icon"
        />
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <Button variant="outline" size="sm" onClick={onCancel} data-testid="button-cancel-category">
          Cancel
        </Button>
        <Button size="sm" onClick={() => onSubmit(formData)} data-testid="button-save-category">
          {category ? "Update" : "Add"} Category
        </Button>
      </div>
    </div>
  );
}

function StoreItemForm({ 
  item, 
  onSubmit, 
  onCancel 
}: { 
  item?: StoreItem; 
  onSubmit: (data: any) => void; 
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: item?.name || "",
    imageUrl: item?.imageUrl || "",
    price: item?.price || 100,
    itemType: item?.itemType || "avatar",
  });
  const [uploading, setUploading] = useState(false);

  const handleAvatarUpload = async (file: File) => {
    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      const response = await fetch("/api/admin/upload/avatar", {
        method: "POST",
        body: formDataUpload,
        credentials: "include",
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Upload failed");
      }
      const { url } = await response.json();
      setFormData((prev) => ({ ...prev, imageUrl: url }));
      toast({ title: "Avatar uploaded!" });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">Avatar Name</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter avatar name"
          data-testid="input-avatar-name"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Avatar Image</Label>
        <FileDropzone
          accept="image/*"
          variant="image"
          label="Drop avatar image or tap to browse"
          hint="JPG, PNG, GIF up to 10MB"
          preview={formData.imageUrl || null}
          isUploading={uploading}
          onFileSelect={handleAvatarUpload}
          onClear={() => setFormData((prev) => ({ ...prev, imageUrl: "" }))}
        />
        <Input
          value={formData.imageUrl}
          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
          placeholder="Or enter URL directly (e.g., dicebear.com)"
          className="mt-2"
          data-testid="input-avatar-image"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Price (Crave Coins)</Label>
        <Input
          type="number"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
          placeholder="100"
          data-testid="input-avatar-price"
        />
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <Button variant="outline" size="sm" onClick={onCancel} data-testid="button-cancel-avatar">
          Cancel
        </Button>
        <Button size="sm" onClick={() => onSubmit(formData)} data-testid="button-save-avatar">
          {item ? "Update" : "Add"} Avatar
        </Button>
      </div>
    </div>
  );
}

function AdminPasswordGate({ onVerified }: { onVerified: () => void }) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const verifyMutation = useMutation({
    mutationFn: (password: string) => apiRequest("POST", "/api/admin/verify-password", { password }),
    onSuccess: () => {
      toast({ title: "Admin access granted" });
      onVerified();
    },
    onError: (error: Error) => {
      setError(error.message || "Invalid admin password");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    verifyMutation.mutate(password);
  };

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Card className="p-6 w-full max-w-sm">
        <div className="text-center mb-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">Admin Access</h2>
          <p className="text-sm text-muted-foreground">Enter admin password to continue</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin password"
              data-testid="input-admin-password"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0"
              onClick={() => setShowPassword(!showPassword)}
              data-testid="button-toggle-password"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          
          {error && (
            <p className="text-sm text-destructive" data-testid="text-password-error">{error}</p>
          )}
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={verifyMutation.isPending}
            data-testid="button-submit-password"
          >
            {verifyMutation.isPending ? "Verifying..." : "Access Admin Panel"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default function Admin() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("games");
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingStoreItem, setEditingStoreItem] = useState<StoreItem | null>(null);
  const [showGameForm, setShowGameForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showStoreItemForm, setShowStoreItemForm] = useState(false);

  const { data: currentUser } = useQuery<User | null>({
    queryKey: ["/api/me"],
  });

  const { data: adminSession, refetch: refetchSession } = useQuery<{ verified: boolean }>({
    queryKey: ["/api/admin/session"],
    enabled: !!currentUser?.isAdmin,
  });

  const { data, isLoading } = useQuery<AdminData>({
    queryKey: ["/api/admin/dashboard"],
    enabled: !!currentUser?.isAdmin && !!adminSession?.verified,
  });

  const createGameMutation = useMutation({
    mutationFn: (gameData: any) => apiRequest("POST", "/api/admin/games", gameData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/home"] });
      setShowGameForm(false);
      toast({ title: "Game added successfully!" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to add game", description: error.message, variant: "destructive" });
    },
  });

  const updateGameMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PUT", `/api/admin/games/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/home"] });
      setEditingGame(null);
      toast({ title: "Game updated!" });
    },
  });

  const deleteGameMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/games/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/home"] });
      toast({ title: "Game deleted" });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/categories", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setShowCategoryForm(false);
      toast({ title: "Category added!" });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PUT", `/api/admin/categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setEditingCategory(null);
      toast({ title: "Category updated!" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Category deleted" });
    },
  });

  const createStoreItemMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/store-items", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/store"] });
      setShowStoreItemForm(false);
      toast({ title: "Avatar added to store!" });
    },
  });

  const updateStoreItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PUT", `/api/admin/store-items/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/store"] });
      setEditingStoreItem(null);
      toast({ title: "Avatar updated!" });
    },
  });

  const deleteStoreItemMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/store-items/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/store"] });
      toast({ title: "Avatar removed from store" });
    },
  });

  if (!currentUser) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-3 text-sm">Please log in to access admin panel.</p>
        <Button size="sm" asChild>
          <Link href="/login">Login</Link>
        </Button>
      </div>
    );
  }

  if (!currentUser.isAdmin) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground text-sm">You do not have admin access.</p>
      </div>
    );
  }

  if (!adminSession?.verified) {
    return <AdminPasswordGate onVerified={() => refetchSession()} />;
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-10 w-full mb-3" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground text-sm">Failed to load admin data.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-4">
        <h1 className="text-xl font-bold" data-testid="text-admin-title">
          Admin Panel
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage games, categories, and avatars
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="games" className="gap-1.5 text-sm" data-testid="tab-games">
            <Gamepad2 className="h-3.5 w-3.5" />
            Games ({data.games.length})
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-1.5 text-sm" data-testid="tab-categories">
            <FolderOpen className="h-3.5 w-3.5" />
            Categories ({data.categories.length})
          </TabsTrigger>
          <TabsTrigger value="avatars" className="gap-1.5 text-sm" data-testid="tab-avatars">
            <ShoppingBag className="h-3.5 w-3.5" />
            Avatars ({data.storeItems.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="games">
          <div className="mb-3 flex justify-between items-center gap-3">
            <p className="text-xs text-muted-foreground hidden sm:block">
              Add and manage games. Supports HTML5, Flash (via Ruffle), and embed codes.
            </p>
            <Dialog open={showGameForm} onOpenChange={setShowGameForm}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5" data-testid="button-add-game">
                  <Plus className="h-3.5 w-3.5" />
                  Add Game
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-base">Add New Game</DialogTitle>
                </DialogHeader>
                <GameForm
                  categories={data.categories}
                  onSubmit={(formData) => createGameMutation.mutate(formData)}
                  onCancel={() => setShowGameForm(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          <Dialog open={!!editingGame} onOpenChange={(open) => !open && setEditingGame(null)}>
            <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-base">Edit Game</DialogTitle>
              </DialogHeader>
              {editingGame && (
                <GameForm
                  game={editingGame}
                  categories={data.categories}
                  onSubmit={(formData) => updateGameMutation.mutate({ id: editingGame.id, data: formData })}
                  onCancel={() => setEditingGame(null)}
                />
              )}
            </DialogContent>
          </Dialog>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {data.games.map((game) => (
              <Card key={game.id} className="p-2" data-testid={`card-game-${game.id}`}>
                <div className="flex gap-2">
                  <img
                    src={game.thumbnailUrl}
                    alt={game.name}
                    className="w-14 h-10 rounded object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-xs truncate">{game.name}</h3>
                    <p className="text-[10px] text-muted-foreground">{game.type}</p>
                  </div>
                </div>
                <div className="flex gap-1 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-7 text-xs gap-1"
                    onClick={() => setEditingGame(game)}
                    data-testid={`button-edit-game-${game.id}`}
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-7"
                    onClick={() => deleteGameMutation.mutate(game.id)}
                    data-testid={`button-delete-game-${game.id}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            ))}
            {data.games.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground text-sm">
                No games yet. Add your first game above.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <div className="mb-3 flex justify-between items-center gap-3">
            <p className="text-xs text-muted-foreground hidden sm:block">
              Organize games into categories for easier navigation.
            </p>
            <Dialog open={showCategoryForm} onOpenChange={setShowCategoryForm}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5" data-testid="button-add-category">
                  <Plus className="h-3.5 w-3.5" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle className="text-base">Add New Category</DialogTitle>
                </DialogHeader>
                <CategoryForm
                  onSubmit={(formData) => createCategoryMutation.mutate(formData)}
                  onCancel={() => setShowCategoryForm(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle className="text-base">Edit Category</DialogTitle>
              </DialogHeader>
              {editingCategory && (
                <CategoryForm
                  category={editingCategory}
                  onSubmit={(formData) => updateCategoryMutation.mutate({ id: editingCategory.id, data: formData })}
                  onCancel={() => setEditingCategory(null)}
                />
              )}
            </DialogContent>
          </Dialog>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {data.categories.map((category) => (
              <Card key={category.id} className="p-2" data-testid={`card-category-${category.id}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Gamepad2 className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-xs truncate">{category.name}</h3>
                    <p className="text-[10px] text-muted-foreground truncate">{category.icon}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-7 text-xs gap-1"
                    onClick={() => setEditingCategory(category)}
                    data-testid={`button-edit-category-${category.id}`}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-7"
                    onClick={() => deleteCategoryMutation.mutate(category.id)}
                    data-testid={`button-delete-category-${category.id}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="avatars">
          <div className="mb-3 flex justify-between items-center gap-3">
            <p className="text-xs text-muted-foreground hidden sm:block">
              Add avatars to the store for users to purchase with Crave Coins.
            </p>
            <Dialog open={showStoreItemForm} onOpenChange={setShowStoreItemForm}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5" data-testid="button-add-avatar">
                  <Plus className="h-3.5 w-3.5" />
                  Add Avatar
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle className="text-base">Add New Avatar</DialogTitle>
                </DialogHeader>
                <StoreItemForm
                  onSubmit={(formData) => createStoreItemMutation.mutate(formData)}
                  onCancel={() => setShowStoreItemForm(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          <Dialog open={!!editingStoreItem} onOpenChange={(open) => !open && setEditingStoreItem(null)}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle className="text-base">Edit Avatar</DialogTitle>
              </DialogHeader>
              {editingStoreItem && (
                <StoreItemForm
                  item={editingStoreItem}
                  onSubmit={(formData) => updateStoreItemMutation.mutate({ id: editingStoreItem.id, data: formData })}
                  onCancel={() => setEditingStoreItem(null)}
                />
              )}
            </DialogContent>
          </Dialog>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
            {data.storeItems.map((item) => (
              <Card key={item.id} className="p-2" data-testid={`card-avatar-${item.id}`}>
                <div className="flex flex-col items-center text-center">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-10 h-10 rounded-full object-cover mb-1"
                  />
                  <h3 className="font-medium text-xs truncate w-full">{item.name}</h3>
                  <p className="text-[10px] text-muted-foreground">{item.price} coins</p>
                </div>
                <div className="flex gap-1 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-6 text-xs"
                    onClick={() => setEditingStoreItem(item)}
                    data-testid={`button-edit-avatar-${item.id}`}
                  >
                    <Pencil className="h-2.5 w-2.5" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-6"
                    onClick={() => deleteStoreItemMutation.mutate(item.id)}
                    data-testid={`button-delete-avatar-${item.id}`}
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                  </Button>
                </div>
              </Card>
            ))}
            {data.storeItems.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground text-sm">
                No avatars yet. Add your first avatar above.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
