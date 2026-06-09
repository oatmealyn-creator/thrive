import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { motion, AnimatePresence } from "motion/react";
import { Sprout, Plus, Share2, LogOut, Settings, Pencil, Trash2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import AddItemModal from "@/components/AddItemModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const CATEGORIES = ["All", "Plants", "Pots", "Tools", "Seeds", "Accessories"];

export default function Dashboard() {
  const { user, refresh, logout } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [filter, setFilter] = useState("All");
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchItems = async () => {
    try {
      const { data } = await apiFetch<any[]>("/api/items");
      setItems(data);
    } catch {
      toast.error("Couldn't load your items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleCreated = (item: any, mode: "create" | "update") => {
    if (mode === "create") setItems((s) => [item, ...s]);
    else setItems((s) => s.map((i) => (i.item_id === item.item_id ? item : i)));
    setEditingItem(null);
  };

  const handleDelete = async (item: any) => {
    if (!confirm(`Delete "${item.name}"?`)) return;
    try {
      await apiFetch(`/api/items/${item.item_id}`, { method: "DELETE" });
      setItems((s) => s.filter((i) => i.item_id !== item.item_id));
      toast.success("Removed");
    } catch {
      toast.error("Delete failed");
    }
  };

  const storefrontUrl = user ? `${window.location.origin}/g/${user.username || user.user_id}` : "";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(storefrontUrl);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Copy failed");
    }
  };

  const filtered = filter === "All" ? items : items.filter((i) => i.category === filter);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="px-5 sm:px-10 py-4 flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <Sprout className="w-6 h-6 text-primary" strokeWidth={1.5} />
            <span className="font-display text-xl text-foreground">Plotly</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setEditingItem(null); setShowAdd(true); }}
              className="hidden sm:inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-sm px-4 py-2 rounded-full font-medium hover:bg-[#3A5233] transition-colors mr-2"
              data-testid="header-add-button"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2.5 rounded-full hover:bg-secondary"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5 text-foreground" />
            </button>
            <button
              onClick={logout}
              className="p-2.5 rounded-full hover:bg-secondary"
              aria-label="Logout"
            >
              <LogOut className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>
      </header>

      <main className="px-5 sm:px-10 max-w-7xl mx-auto pb-32">
        <section className="pt-8 pb-6">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold mb-2">Your garden</div>
          <h1 className="font-display text-4xl sm:text-5xl text-foreground" data-testid="dashboard-heading">
            Hi {user?.name?.split(" ")[0] || "gardener"}.
          </h1>
          <div className="mt-5 flex flex-wrap items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3 max-w-2xl">
            <Share2 className="w-4 h-4 text-primary flex-shrink-0" />
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Your link</div>
            <div className="font-mono text-sm text-foreground truncate flex-1 min-w-0" data-testid="storefront-link-text">
              {storefrontUrl}
            </div>
            <button
              onClick={copyLink}
              className="inline-flex items-center gap-1.5 bg-foreground text-background text-xs px-3 py-2 rounded-full hover:bg-primary transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
            <a
              href={storefrontUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-primary underline underline-offset-4 hover:text-[#3A5233]"
            >
              View
            </a>
          </div>
        </section>

        <div className="flex gap-2 overflow-x-auto no-scrollbar py-3 -mx-5 px-5">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              data-testid={`filter-${c.toLowerCase()}`}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === c
                  ? "bg-foreground text-background"
                  : "bg-card border border-border text-muted-foreground hover:border-[#8B9E7B]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <section className="mt-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl h-56 bg-secondary animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-card border border-dashed border-border rounded-3xl p-12 text-center mt-4">
              <Sprout className="w-10 h-10 text-primary mx-auto mb-3" strokeWidth={1.5} />
              <div className="font-display text-2xl text-foreground">Your garden is quiet.</div>
              <div className="text-muted-foreground mt-2">Add your first plant, pot or tool.</div>
              <button
                onClick={() => { setEditingItem(null); setShowAdd(true); }}
                className="mt-6 inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium hover:bg-[#3A5233]"
              >
                <Plus className="w-4 h-4" /> Add your first item
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <AnimatePresence>
                {filtered.map((item, i) => (
                  <motion.div
                    key={item.item_id}
                    layout
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.35, delay: i * 0.03 }}
                    className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
                    data-testid={`item-card-${item.item_id}`}
                  >
                    <div className="aspect-square bg-secondary relative">
                      {item.image_base64 ? (
                        <img src={item.image_base64} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Sprout className="w-10 h-10" strokeWidth={1.5} />
                        </div>
                      )}
                      <div className="absolute top-2 left-2 bg-white/90 text-muted-foreground text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-full">
                        {item.category}
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-display text-base text-foreground break-words">{item.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">Stock: {item.stock}</div>
                        </div>
                        <div className="font-display text-lg text-primary">${item.price}</div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => { setEditingItem(item); setShowAdd(true); }}
                          className="flex-1 inline-flex items-center justify-center gap-1 text-xs border border-border rounded-lg py-1.5 hover:bg-secondary"
                        >
                          <Pencil className="w-3 h-3" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="inline-flex items-center justify-center gap-1 text-xs text-destructive border border-border rounded-lg py-1.5 px-2 hover:bg-[#FCEFEC]"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </main>

      {items.length > 0 && (
        <button
          onClick={() => { setEditingItem(null); setShowAdd(true); }}
          className="sm:hidden fixed bottom-6 right-6 z-40 bg-primary text-primary-foreground rounded-full w-14 h-14 flex items-center justify-center shadow-xl hover:bg-[#3A5233] transition-transform active:scale-95"
          aria-label="Add item"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      <AddItemModal
        open={showAdd}
        onOpenChange={(v) => { setShowAdd(v); if (!v) setEditingItem(null); }}
        onCreated={handleCreated}
        editingItem={editingItem}
      />

      <SettingsModal
        open={showSettings}
        onOpenChange={setShowSettings}
        user={user}
        onSaved={refresh}
      />
    </div>
  );
}

function SettingsModal({ open, onOpenChange, user, onSaved }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  user: any;
  onSaved: () => Promise<void>;
}) {
  const [storeName, setStoreName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && user) {
      setStoreName(user.store_name || "");
      setUsername(user.username || "");
      setBio(user.bio || "");
      setWhatsapp(user.whatsapp_number || "");
    }
  }, [open, user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiFetch("/api/profile/me", {
        method: "PUT",
        body: JSON.stringify({
          store_name: storeName,
          username,
          bio,
          whatsapp_number: whatsapp,
        }),
      });
      toast.success("Saved");
      await onSaved();
      onOpenChange(false);
    } catch (err: any) {
      const detail = err?.data?.detail || "Save failed";
      toast.error(detail);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border-border" data-testid="settings-modal">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Store settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Store name</Label>
            <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} className="bg-card mt-1" />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Username (URL slug)</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} className="bg-card mt-1" />
            <div className="text-xs text-muted-foreground mt-1">plotly.app/g/{username || "your-name"}</div>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">WhatsApp number (with country code)</Label>
            <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+919876543210" className="bg-card mt-1" />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Bio</Label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Backyard gardener since 2018. Organic, hand-grown." className="bg-card mt-1" />
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-primary-foreground rounded-xl py-3 font-medium hover:bg-[#3A5233] disabled:opacity-50 mt-2"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </DialogContent>
    </Dialog>
  );
}
