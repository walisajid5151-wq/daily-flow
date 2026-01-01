import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTheme, THEMES } from "@/hooks/useTheme";
import { BottomNav } from "@/components/BottomNav";
import { ArrowLeft, Moon, Bell, Clock, Volume2, LogOut, User, Palette, Flame } from "lucide-react";

export default function Settings() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDark, themeColor, setDarkMode, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [focusDuration, setFocusDuration] = useState("25");
  const [snoozeDuration, setSnoozeDuration] = useState("5");
  const [streak, setStreak] = useState(0);
  const [editingStreak, setEditingStreak] = useState(false);
  const [tempStreak, setTempStreak] = useState("0");

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    
    if (data) {
      setNotifications(data.notification_enabled ?? true);
      setFocusDuration(String(data.daily_focus_minutes ?? 25));
      setSnoozeDuration(String(data.snooze_duration ?? 5));
    }

    // Fetch streak from daily_reviews
    const today = new Date().toISOString().split('T')[0];
    const { data: reviews } = await supabase
      .from("daily_reviews")
      .select("review_date, all_completed")
      .eq("user_id", user.id)
      .order("review_date", { ascending: false })
      .limit(30);

    if (reviews && reviews.length > 0) {
      let currentStreak = 0;
      const dates = reviews.filter(r => r.all_completed).map(r => r.review_date);
      
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date();
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];
        
        if (dates.includes(dateStr)) {
          currentStreak++;
        } else if (i > 0) {
          break;
        }
      }
      setStreak(currentStreak);
      setTempStreak(String(currentStreak));
    }
  };

  const updateProfile = async (field: string, value: any) => {
    if (!user) return;
    await supabase
      .from("profiles")
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq("id", user.id);
  };

  const handleStreakSave = async () => {
    const newStreak = parseInt(tempStreak) || 0;
    setStreak(newStreak);
    setEditingStreak(false);
    
    // Create/update daily reviews to reflect the streak
    if (user && newStreak > 0) {
      for (let i = 0; i < newStreak; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        await supabase
          .from("daily_reviews")
          .upsert({
            user_id: user.id,
            review_date: dateStr,
            all_completed: true
          }, { onConflict: 'user_id,review_date' });
      }
    }
    
    toast({ title: "Streak updated!" });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
    toast({ title: "Signed out" });
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-gradient-hero pb-24">
      <header className="p-4 pt-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-display font-bold">Settings</h1>
      </header>

      <main className="px-4 space-y-4">
        {/* Profile */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center">
              <User className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">{user?.email}</p>
              <p className="text-sm text-muted-foreground">Planit User</p>
            </div>
            <div className="streak-badge">
              <Flame className="w-4 h-4" />
              {streak} day{streak !== 1 ? 's' : ''}
            </div>
          </div>
        </motion.div>

        {/* Streak Adjustment */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }} className="glass-card p-4 space-y-4">
          <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wider">Streak</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Flame className="w-5 h-5 text-accent" />
              <span className="text-foreground">Current Streak</span>
            </div>
            {editingStreak ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={tempStreak}
                  onChange={(e) => setTempStreak(e.target.value)}
                  className="w-20 h-8 text-center"
                  min="0"
                />
                <Button size="sm" onClick={handleStreakSave}>Save</Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setEditingStreak(true)}>
                {streak} days - Edit
              </Button>
            )}
          </div>
        </motion.div>

        {/* Appearance */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-4 space-y-4">
          <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wider">Appearance</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-muted-foreground" />
              <span className="text-foreground">Dark Mode</span>
            </div>
            <Switch checked={isDark} onCheckedChange={setDarkMode} />
          </div>
          
          {/* Theme Colors */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Palette className="w-5 h-5 text-muted-foreground" />
              <span className="text-foreground">Theme Color</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setTheme(theme.id)}
                  className={`theme-btn ${themeColor === theme.id ? 'active' : ''}`}
                  style={{ backgroundColor: theme.color }}
                  title={theme.name}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-4 space-y-4">
          <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wider">Notifications</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="text-foreground">Enable Notifications</span>
            </div>
            <Switch 
              checked={notifications} 
              onCheckedChange={(v) => {
                setNotifications(v);
                updateProfile("notification_enabled", v);
              }} 
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-muted-foreground" />
              <span className="text-foreground">Snooze Duration</span>
            </div>
            <Select 
              value={snoozeDuration} 
              onValueChange={(v) => {
                setSnoozeDuration(v);
                updateProfile("snooze_duration", parseInt(v));
              }}
            >
              <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 min</SelectItem>
                <SelectItem value="10">10 min</SelectItem>
                <SelectItem value="15">15 min</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Focus / Pomodoro */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-4 space-y-4">
          <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wider">Pomodoro Focus</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <span className="text-foreground">Work Duration</span>
            </div>
            <Select 
              value={focusDuration} 
              onValueChange={(v) => {
                setFocusDuration(v);
                updateProfile("daily_focus_minutes", parseInt(v));
              }}
            >
              <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 min</SelectItem>
                <SelectItem value="25">25 min</SelectItem>
                <SelectItem value="30">30 min</SelectItem>
                <SelectItem value="45">45 min</SelectItem>
                <SelectItem value="60">60 min</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            Pomodoro: {focusDuration} min work + 5 min break
          </p>
        </motion.div>

        {/* Sign Out */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Button variant="destructive" className="w-full gap-2" onClick={handleSignOut}>
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
}