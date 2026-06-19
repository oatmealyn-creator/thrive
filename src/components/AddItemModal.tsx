import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Camera, Sparkles, X } from "lucide-react";

const CATEGORIES = ["Plants", "Pots", "Tools", "Seeds", "Accessories"];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AddItemModal({
  open,
  onOpenChange,
  onCreated,
  editingItem,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (item: any, mode: "create" | "update") => void;
  editingItem: any | null;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Plants");
  const [description, setDescription] = useState("");
  const [stock, setStock] = useState(1);
  const [imageB64, setImageB64] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [aiConfidence, setAiConfidence] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (editingItem) {
        setName(editingItem.name || "");
        setPrice(String(editingItem.price ?? ""));
        setCategory(editingItem.category || "Plants");
        setDescription(editingItem.description || "");
        setStock(editingItem.stock ?? 1);
        setImageB64(editingItem.image_base64 || "");
        setAiConfidence(null);
      } else {
        setName(""); setPrice(""); setCategory("Plants"); setDescription("");
        setStock(1); setImageB64(""); setAiConfidence(null);
      }
    }
  }, [open, editingItem]);

  const handlePickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const b64 = await fileToBase64(f);
    setImageB64(b64);
    setDetecting(true);
    setAiConfidence(null);
    try {
      const { data } = await apiFetch<{ confidence: string; name: string; category: string; description: string }>(
        "/api/ai/detect-plant",
        { method: "POST", body: JSON.stringify({ image_base64: b64 }) },
      );
      setAiConfidence(data.confidence);
      if (data.confidence !== "low" && data.name) {
        setName(data.name);
        if (data.category) setCategory(data.category);
        if (data.description) setDescription(data.description);
        toast.success(`AI detected: ${data.name}`);
      } else {
        toast.message("Couldn't identify confidently — please type the name.");
      }
    } catch {
      toast.error("AI detection failed — type the details manually.");
    } finally {
      setDetecting(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !price) {
      toast.error("Name and price are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        price: parseFloat(price),
        category,
        description,
        stock: parseInt(String(stock), 10) || 1,
        image_base64: imageB64,
      };
      if (editingItem) {
        const { data } = await apiFetch(`/api/items/${editingItem.item_id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        onCreated(data, "update");
        toast.success("Updated");
      } else {
        const { data } = await apiFetch("/api/items", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        onCreated(data, "create");
        toast.success("Added to your garden");
      }
      onOpenChange(false);
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[32rem] bg-background border-border" data-testid="add-item-modal">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-foreground">
            {editingItem ? "Edit item" : "Add a new item"}
          </DialogTitle>
        </DialogHeader>

        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePickImage}
            className="hidden"
            data-testid="upload-photo-input"
          />
          {!imageB64 ? (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center p-10 bg-card text-muted-foreground hover:bg-secondary transition-colors"
              data-testid="upload-trigger"
            >
              <Camera className="w-8 h-8 mb-3 text-primary" strokeWidth={1.5} />
              <div className="font-display text-lg text-foreground">Take or upload a photo</div>
              <div className="text-xs text-muted-foreground mt-1">We'll try to identify it for you</div>
            </button>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border border-border">
              <img src={imageB64} alt="preview" className="w-full h-56 object-cover" />
              {detecting && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute inset-0 bg-black/20" />
                  <motion.div
                    initial={{ top: "0%" }}
                    animate={{ top: "100%" }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent shadow-lg"
                    style={{ boxShadow: "0 0 12px var(--color-primary), 0 0 30px var(--color-primary)" }}
                  />
                </div>
              )}
              <button
                onClick={() => { setImageB64(""); setAiConfidence(null); }}
                className="absolute top-3 right-3 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80"
                aria-label="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
              {aiConfidence && (
                <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  aiConfidence === "high" ? "bg-primary text-primary-foreground" :
                  aiConfidence === "medium" ? "bg-accent text-white" :
                  "bg-white/90 text-foreground border border-border"
                }`}>
                  <Sparkles className="inline w-3 h-3 mr-1" /> AI {aiConfidence}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid gap-3 mt-2">
          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mango Sapling" className="bg-card mt-1" data-testid="item-name-input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Price (₹)</Label>
              <Input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="24" className="bg-card mt-1" data-testid="item-price-input" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Stock</Label>
              <Input type="number" min="0" value={stock} onChange={(e) => setStock(Number(e.target.value))} className="bg-card mt-1" data-testid="item-stock-input" />
            </div>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-card mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Healthy, 2-foot sapling. Grown without pesticides." className="bg-card mt-1" />
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 border border-foreground text-foreground rounded-xl py-3 font-medium hover:bg-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || detecting}
            className="flex-1 bg-primary text-primary-foreground rounded-xl py-3 font-medium hover:bg-[#3A5233] disabled:opacity-50"
            data-testid="save-item-button"
          >
            {saving ? "Saving…" : editingItem ? "Update" : "Add to garden"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
