import { useState } from "react";
import { Link } from "react-router-dom";
import { Sprout } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Login() {
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const { data } = await apiFetch<{ user: any; session_id: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (data.session_id) {
        localStorage.setItem("session_id", data.session_id);
      }
      setUser(data.user);
      toast.success("Welcome back!");
      window.location.href = "/dashboard";
    } catch (err: any) {
      toast.error(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <Link to="/" className="flex items-center gap-2 mb-12">
        <Sprout className="w-7 h-7 text-primary" strokeWidth={1.5} />
        <span className="font-display text-2xl tracking-tight text-foreground">Thrive</span>
      </Link>

      <div className="w-full max-w-[24rem]">
        <h1 className="font-display text-3xl text-foreground text-center">Welcome back</h1>
        <p className="text-muted-foreground text-sm text-center mt-2">Sign in to your garden storefront</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full h-10 rounded-md border border-border bg-card px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="gardener@example.com"
              data-testid="login-email-input"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full h-10 rounded-md border border-border bg-card px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="••••••••"
              data-testid="login-password-input"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-medium hover:bg-[#3A5233] disabled:opacity-50 transition-colors"
            data-testid="login-submit-button"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-sm text-muted-foreground text-center mt-8">
          Don't have a storefront?{" "}
          <Link to="/register" className="text-primary underline underline-offset-4 hover:text-[#3A5233]">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
