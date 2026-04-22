import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, Button, Label, SectionHeader } from "@/components/ui-brutal";
import { mockKnocks, mockJobs, mockQuotes, todayStats } from "@/lib/mock-data";
import { Settings, LogOut, Bell, Trophy, Flame, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/me")({
  component: MePage,
});

function MePage() {
  const totalKnocks = mockKnocks.length;
  const totalQuotes = mockQuotes.length;
  const acceptedQuotes = mockQuotes.filter((q) => q.status === "accepted").length;
  const conversion = totalQuotes > 0 ? Math.round((acceptedQuotes / totalQuotes) * 100) : 0;
  const monthEarned = mockJobs
    .filter((j) => j.status === "paid")
    .reduce((s, j) => s + j.price, 0) + 240;

  // Heatmap streak — last 7 days mocked
  const streak = [3, 2, 4, 5, 0, 4, 5];
  const streakLevel = (n: number) => Math.min(5, n);

  return (
    <AppShell title="Me" subtitle="Profile · Stats">
      {/* Profile card */}
      <Card className="p-4 mb-5 flex items-center gap-4">
        <div className="size-16 border-2 border-foreground bg-[var(--amber)] flex items-center justify-center font-mono font-bold text-2xl shrink-0">
          HG
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-display font-bold uppercase text-xl tracking-tight leading-none">
            Holy Giraffe
          </h2>
          <p className="text-xs font-mono text-muted-foreground mt-1">
            Field Agent · Member since 2024
          </p>
        </div>
      </Card>

      {/* Today */}
      <SectionHeader>Today</SectionHeader>
      <div className="grid grid-cols-3 gap-2 mb-5">
        <Card className="p-3">
          <Label className="text-[10px] tracking-[0.15em]">Knocks</Label>
          <div className="text-3xl font-mono font-bold mt-1 leading-none">{todayStats.knocks}</div>
        </Card>
        <Card className="p-3 bg-[var(--amber)]">
          <div className="text-[10px] font-mono font-bold uppercase tracking-[0.15em] opacity-70">Quoted</div>
          <div className="text-3xl font-mono font-bold mt-1 leading-none">{todayStats.quoted}</div>
        </Card>
        <Card className="p-3 bg-foreground text-background">
          <div className="text-[10px] font-mono font-bold uppercase tracking-[0.15em] opacity-70">Booked</div>
          <div className="text-3xl font-mono font-bold mt-1 leading-none">{todayStats.booked}</div>
        </Card>
      </div>

      {/* Streak heatmap */}
      <SectionHeader
        action={
          <span className="flex items-center gap-1 font-mono font-bold text-xs uppercase tracking-wider px-2 py-0.5 border-2 border-foreground bg-card">
            <Flame className="size-3" strokeWidth={2.5} />
            5 days
          </span>
        }
      >
        Knock Streak
      </SectionHeader>
      <Card className="p-3 mb-5">
        <div className="grid grid-cols-7 gap-1.5 mb-2">
          {streak.map((n, i) => (
            <div
              key={i}
              className={`aspect-square border-2 border-foreground flex items-center justify-center heatmap-${streakLevel(n)}`}
              title={`${n} knocks`}
            >
              <span className={`font-mono font-bold text-sm ${n >= 4 ? "text-background" : ""}`}>
                {n}
              </span>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-muted-foreground">
          <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
        </div>
      </Card>

      {/* All-time */}
      <SectionHeader>All Time</SectionHeader>
      <div className="grid grid-cols-2 gap-2 mb-5">
        <Card className="p-3">
          <Label className="text-[10px] tracking-[0.15em]">Total Knocks</Label>
          <div className="text-3xl font-mono font-bold mt-1 leading-none">{totalKnocks * 47}</div>
        </Card>
        <Card className="p-3">
          <Label className="text-[10px] tracking-[0.15em]">Conversion</Label>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-mono font-bold leading-none">{conversion}%</span>
            <TrendingUp className="size-4 text-[var(--success)]" strokeWidth={2.5} />
          </div>
        </Card>
        <Card className="p-3 col-span-2 bg-foreground text-background">
          <div className="text-[10px] font-mono font-bold uppercase tracking-[0.15em] opacity-70">
            Earned This Month
          </div>
          <div className="text-5xl font-mono font-bold mt-1 leading-none">£{monthEarned}</div>
          <div className="heatmap-bar h-2 mt-3 border-2 border-background" />
          <div className="text-[10px] font-mono mt-1.5 opacity-70">
            73% to £330 goal
          </div>
        </Card>
      </div>

      {/* Achievements */}
      <SectionHeader count={3}>Badges</SectionHeader>
      <div className="grid grid-cols-3 gap-2 mb-5">
        <Card className="p-3 text-center bg-[var(--amber)]">
          <Trophy className="size-7 mx-auto mb-1" strokeWidth={2.5} />
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider">100 Knocks</div>
        </Card>
        <Card className="p-3 text-center bg-[var(--success)] text-[var(--success-foreground)]">
          <Flame className="size-7 mx-auto mb-1" strokeWidth={2.5} />
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider">5 Day Streak</div>
        </Card>
        <Card className="p-3 text-center">
          <TrendingUp className="size-7 mx-auto mb-1 text-muted-foreground" strokeWidth={2.5} />
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">£500 Mon</div>
        </Card>
      </div>

      {/* Settings */}
      <SectionHeader>Settings</SectionHeader>
      <div className="space-y-2 mb-6">
        <button className="press-brutal w-full border-2 border-foreground bg-card p-3 flex items-center gap-3 font-mono font-bold uppercase tracking-wider text-sm">
          <Bell className="size-5" strokeWidth={2.5} />
          Notifications
        </button>
        <button className="press-brutal w-full border-2 border-foreground bg-card p-3 flex items-center gap-3 font-mono font-bold uppercase tracking-wider text-sm">
          <Settings className="size-5" strokeWidth={2.5} />
          Preferences
        </button>
      </div>

      <Button variant="destructive" block className="py-4">
        <LogOut className="size-5" strokeWidth={2.5} />
        Sign Out
      </Button>
    </AppShell>
  );
}
