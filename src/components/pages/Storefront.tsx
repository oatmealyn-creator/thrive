import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "@/lib/api";
import { motion, AnimatePresence } from "motion/react";
import { Sprout, Plus, Minus, MessageCircle, ShoppingBag, X } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = ["All", "Plants", "Pots", "Tools", "Seeds", "Accessories"];

export default function Storefront() {
  const { username } = useParams<{ username: string }>();
  const [data, setData] = useState<{ profile: any; items: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState("All");
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    if (!username) return;
    (async () => {
      try {
        const { data: res } = await apiFetch<{ profile: any; items: any[] }>(
          `/api/storefront/${username}`,
        );
        setData(res);
      } catch (e: any) {
        setError(e?.data?.detail || "Storefront not found");
      } finally {
        setLoading(false);
      }
    })();
  }, [username]);

  const itemMap = useMemo(() => {
    const m: Record<string, any> = {};
    (data?.items || []).forEach((i: any) => (m[i.item_id] = i));
    return m;
  }, [data]);

  const cartLines = (Object.entries(cart) as [string, number][])
    .filter(([, q]) => q > 0)
    .map(([id, qty]) => ({ item: itemMap[id], qty }))
    .filter((l) => l.item);

  const totalQty = cartLines.reduce((s, l) => s + l.qty, 0);
  const totalPrice = cartLines.reduce((s, l) => s + l.qty * l.item.price, 0);

  const addToCart = (id: string) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const removeFromCart = (id: string) => setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] || 0) - 1) }));

  const checkoutWhatsApp = () => {
    if (cartLines.length === 0 || !data) return;
    const wa = (data.profile.whatsapp_number || "").replace(/[^\d+]/g, "");
    if (!wa) {
      toast.error("This gardener hasn't set up WhatsApp yet.");
      return;
    }
    const lines = cartLines
      .map((l) => `• ${l.qty} × ${l.item.name} — $${(l.item.price * l.qty).toFixed(2)}`)
      .join("\n");
    const text =
      `Hi ${data.profile.name || ""}! I'd like to order from ${data.profile.store_name || "your garden"}:\n\n` +
      `${lines}\n\nTotal: $${totalPrice.toFixed(2)}\n\nLink: ${window.location.href}`;
    const url = `https://wa.me/${wa.replace(/^\+/, "")}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground font-display">
        Loading…
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <Sprout className="w-12 h-12 text-primary mb-4" strokeWidth={1.5} />
        <div className="font-display text-3xl text-foreground">Nothing growing here.</div>
        <div className="text-muted-foreground mt-2">{error}</div>
      </div>
    );
  }

  const profile = data!.profile;
  const items = data!.items || [];
  const filtered = filter === "All" ? items : items.filter((i) => i.category === filter);

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="bg-foreground text-background px-6 sm:px-10 lg:px-16 pt-10 pb-16 sm:pb-20 rounded-b-[2rem] relative overflow-hidden">
        <div className="max-w-4xl">
          <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-bold">Storefront</div>
          <h1 className="font-display text-4xl sm:text-6xl mt-3 leading-none" data-testid="storefront-title">
            {profile.store_name || profile.name}
          </h1>
          {profile.bio && (
            <p className="mt-5 text-[#C4CFB9] text-base sm:text-lg max-w-xl leading-relaxed">{profile.bio}</p>
          )}
          <div className="mt-6 flex items-center gap-3 text-sm text-[#C4CFB9]">
            {profile.picture ? (
              <img src={profile.picture} alt="" className="w-9 h-9 rounded-full border border-primary" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
                <Sprout className="w-4 h-4 text-white" />
              </div>
            )}
            <span className="min-w-0 break-words">Grown by {profile.name}</span>
          </div>
        </div>
        <Sprout className="absolute -right-8 -bottom-8 w-64 h-64 text-primary/30" strokeWidth={0.6} />
      </header>

      <main className="px-5 sm:px-10 max-w-6xl mx-auto -mt-8">
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              data-testid={`store-filter-${c.toLowerCase()}`}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === c
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:border-[#8B9E7B]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-3xl p-12 text-center mt-8">
            <Sprout className="w-10 h-10 text-primary mx-auto mb-3" strokeWidth={1.5} />
            <div className="font-display text-xl text-foreground">No items in this category yet.</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {filtered.map((item, i) => {
              const qty = cart[item.item_id] || 0;
              return (
                <motion.div
                  key={item.item_id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.03 }}
                  className="bg-card border border-border rounded-3xl overflow-hidden hover:shadow-md transition-shadow"
                  data-testid={`product-card-${item.item_id}`}
                >
                  <div className="aspect-square bg-secondary relative">
                    {item.image_base64 ? (
                      <img src={item.image_base64} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Sprout className="w-12 h-12" strokeWidth={1.5} />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 bg-white/90 text-muted-foreground text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full">
                      {item.category}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-display text-lg text-foreground break-words">{item.name}</div>
                        {item.description && (
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</div>
                        )}
                      </div>
                      <div className="font-display text-xl text-primary flex-shrink-0">${item.price}</div>
                    </div>
                    <div className="mt-4">
                      {qty === 0 ? (
                        <button
                          onClick={() => addToCart(item.item_id)}
                          className="w-full bg-foreground text-background rounded-full py-2.5 text-sm font-medium hover:bg-primary transition-colors inline-flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" /> Add to order
                        </button>
                      ) : (
                        <div className="flex items-center justify-between bg-secondary rounded-full p-1">
                          <button
                            onClick={() => removeFromCart(item.item_id)}
                            className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center"
                            aria-label="Decrease"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <div className="font-display text-lg">{qty}</div>
                          <button
                            onClick={() => addToCart(item.item_id)}
                            className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                            aria-label="Increase"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      <AnimatePresence>
        {totalQty > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-0 left-0 right-0 z-40"
          >
            <div className="px-4 pb-4">
              <div className="max-w-4xl mx-auto bg-card border border-border rounded-3xl p-3 sm:p-4 shadow-2xl flex items-center justify-between gap-3 backdrop-blur-xl">
                <button
                  onClick={() => setCartOpen(true)}
                  className="flex items-center gap-3 flex-1 text-left"
                >
                  <div className="bg-secondary rounded-2xl w-12 h-12 flex items-center justify-center relative">
                    <ShoppingBag className="w-5 h-5 text-primary" />
                    <span className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {totalQty}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-widest text-muted-foreground">Your order</div>
                    <div className="font-display text-lg text-foreground">${totalPrice.toFixed(2)}</div>
                  </div>
                </button>
                <button
                  onClick={checkoutWhatsApp}
                  className="bg-[#25D366] text-white px-5 py-3 rounded-2xl font-medium inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="hidden sm:inline">Order on WhatsApp</span>
                  <span className="sm:hidden">Order</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cartOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center sm:justify-center p-0 sm:p-6"
            onClick={() => setCartOpen(false)}
            data-testid="cart-drawer"
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="font-display text-2xl text-foreground">Your order</div>
                <button onClick={() => setCartOpen(false)} className="p-2 rounded-full hover:bg-secondary">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {cartLines.map((l) => (
                  <div key={l.item.item_id} className="flex items-center gap-3 bg-card border border-border rounded-2xl p-3">
                    <div className="w-14 h-14 rounded-xl bg-secondary overflow-hidden flex-shrink-0">
                      {l.item.image_base64 && <img src={l.item.image_base64} className="w-full h-full object-cover" alt="" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-base text-foreground break-words">{l.item.name}</div>
                      <div className="text-xs text-muted-foreground">${l.item.price} × {l.qty}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => removeFromCart(l.item.item_id)} className="w-7 h-7 rounded-full border border-border flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                      <div className="w-6 text-center font-medium">{l.qty}</div>
                      <button onClick={() => addToCart(l.item.item_id)} className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
                <div className="text-muted-foreground">Total</div>
                <div className="font-display text-2xl text-foreground">${totalPrice.toFixed(2)}</div>
              </div>
              <button
                onClick={checkoutWhatsApp}
                className="w-full mt-5 bg-[#25D366] text-white px-5 py-4 rounded-2xl font-medium inline-flex items-center justify-center gap-2 hover:opacity-90"
              >
                <MessageCircle className="w-5 h-5" /> Send order on WhatsApp
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
