import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sprout } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Register() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      const { data } = await apiFetch<{ user: any; session_id: string }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      if (data.session_id) {
        localStorage.setItem("session_id", data.session_id);
      }
      setUser(data.user);
      toast.success("Storefront created!");
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      toast.error(err?.message || "Registration failed");
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
        <h1 className="font-display text-3xl text-foreground text-center">Start growing</h1>
        <p className="text-muted-foreground text-sm text-center mt-2">Create your free storefront</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="name" className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full h-10 rounded-md border border-border bg-card px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Your name"
              data-testid="register-name-input"
            />
          </div>
          <div>
            <label htmlFor="email" className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full h-10 rounded-md border border-border bg-card px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="gardener@example.com"
              data-testid="register-email-input"
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
              placeholder="At least 8 characters"
              data-testid="register-password-input"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-medium hover:bg-[#3A5233] disabled:opacity-50 transition-colors"
            data-testid="register-submit-button"
          >
            {loading ? "Creating…" : "Create storefront"}
          </button>
        </form>

        <p className="text-sm text-muted-foreground text-center mt-8">
          Already have a storefront?{" "}
          <Link to="/login" className="text-primary underline underline-offset-4 hover:text-[#3A5233]">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
