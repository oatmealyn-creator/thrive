import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface DailyStats {
  date: string;
  visits: number;
  visitors: number;
}

interface PathStats {
  path: string;
  visits: number;
}

interface StatsData {
  totalVisits: number;
  totalVisitors: number;
  todayVisits: number;
  dailyStats: DailyStats[];
  topPaths: PathStats[];
}

export default function Analytics() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (!user) { navigate("/login", { replace: true }); return; }
    apiFetch<StatsData>(`/api/analytics/stats?days=${days}`)
      .then(({ data }) => setStats(data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [user, days, navigate]);

  if (!user) return null;
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground font-display text-lg">Loading analytics…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="font-display text-xl font-bold text-foreground">Analytics</h1>
          <button onClick={() => navigate("/dashboard")} className="text-sm text-primary hover:underline font-sans">
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* period selector */}
        <div className="flex gap-2">
          {[7, 30, 90].map((n) => (
            <button
              key={n}
              onClick={() => setDays(n)}
              className={`px-3 py-1.5 rounded-full text-sm font-sans font-medium transition-colors ${
                days === n ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-border"
              }`}
            >
              Last {n} days
            </button>
          ))}
        </div>

        {/* summary cards */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Total Visits" value={stats?.totalVisits ?? 0} />
          <StatCard label="Unique Visitors" value={stats?.totalVisitors ?? 0} />
          <StatCard label="Today" value={stats?.todayVisits ?? 0} />
        </div>

        {/* daily chart */}
        <section className="bg-card border border-border rounded-2xl p-4">
          <h2 className="font-display font-semibold text-foreground mb-3">Daily Visits</h2>
          <div className="flex items-end gap-1 h-32">
            {stats?.dailyStats?.map((d) => {
              const max = Math.max(...stats.dailyStats.map((x) => x.visits), 1);
              const h = (d.visits / max) * 100;
              const date = new Date(d.date + "T00:00:00");
              const label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div className="w-full bg-primary/20 rounded-t-sm relative" style={{ height: `${h}%` }}>
                    <div
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-foreground text-background text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                    >
                      {d.visits} visits
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{label}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* top paths */}
        <section className="bg-card border border-border rounded-2xl p-4">
          <h2 className="font-display font-semibold text-foreground mb-3">Top Pages</h2>
          <div className="space-y-2">
            {stats?.topPaths?.map((p) => (
              <div key={p.path} className="flex justify-between items-center py-1">
                <span className="font-sans text-sm text-foreground truncate">{p.path || "/"}</span>
                <span className="font-sans text-sm text-muted-foreground tabular-nums">{p.visits}</span>
              </div>
            ))}
            {(!stats?.topPaths || stats.topPaths.length === 0) && (
              <p className="text-sm text-muted-foreground font-sans">No data yet. Visit the site to start tracking.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 text-center">
      <div className="text-2xl font-bold font-display text-foreground tabular-nums">{value.toLocaleString()}</div>
      <div className="text-xs text-muted-foreground font-sans mt-1">{label}</div>
    </div>
  );
}
