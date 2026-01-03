import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { BottomNav } from "@/components/BottomNav";
import { TaskCard } from "@/components/TaskCard";
import { Plus, ArrowLeft, Calendar } from "lucide-react";
import { format } from "date-fns";

interface Task {
  id: string;
  title: string;
  scheduled_time: string | null;
  duration_minutes: number;
  completed: boolean;
  priority: string;
  scheduled_date: string;
}

export default function Tasks() {
  const { user, supabaseUser, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", time: "", duration: "30", priority: "medium" });

  useEffect(() => {
    if (!loading && (!user || !supabaseUser)) navigate("/auth");
  }, [user, supabaseUser, loading, navigate]);

  useEffect(() => {
    if (supabaseUser) fetchTasks();
  }, [supabaseUser]);

  const fetchTasks = async () => {
    if (!supabaseUser) return;
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", supabaseUser.id)
      .order("scheduled_date", { ascending: true })
      .order("scheduled_time");
    if (error) {
      toast({ title: "Failed to load tasks", description: error.message });
      return;
    }
    if (data) setTasks(data);
  };

  const addTask = async () => {
    if (!newTask.title.trim() || !supabaseUser) return;
    const { error } = await supabase.from("tasks").insert({
      user_id: supabaseUser.id,
      title: newTask.title,
      scheduled_time: newTask.time || null,
      duration_minutes: parseInt(newTask.duration),
      priority: newTask.priority,
      scheduled_date: format(new Date(), "yyyy-MM-dd")
    });
    if (error) {
      toast({ title: "Failed to add task", description: error.message });
      return;
    }
    setNewTask({ title: "", time: "", duration: "30", priority: "medium" });
    setIsOpen(false);
    fetchTasks();
    toast({ title: "Task added!" });
  };

  const toggleTask = async (id: string, completed: boolean) => {
    await supabase.from("tasks").update({ completed: !completed, completed_at: !completed ? new Date().toISOString() : null }).eq("id", id);
    fetchTasks();
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) {
      toast({ title: "Failed to delete task", description: error.message });
      return;
    }
    fetchTasks();
    toast({ title: "Task deleted" });
  };

  if (loading) return null;

  const todayTasks = tasks.filter(t => t.scheduled_date === format(new Date(), "yyyy-MM-dd"));
  const upcomingTasks = tasks.filter(t => t.scheduled_date > format(new Date(), "yyyy-MM-dd"));

  return (
    <div className="min-h-screen bg-gradient-hero pb-24">
      <header className="p-4 pt-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-display font-bold">Tasks</h1>
      </header>

      <main className="px-4 space-y-6">
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Today
            </h2>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1"><Plus className="w-4 h-4" /> Add</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New Task</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-4">
                  <Input placeholder="Task title" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} />
                  <Input type="time" value={newTask.time} onChange={e => setNewTask({ ...newTask, time: e.target.value })} />
                  <Select value={newTask.priority} onValueChange={v => setNewTask({ ...newTask, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button className="w-full" onClick={addTask}>Add Task</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-3">
            {todayTasks.map((task, i) => (
              <TaskCard key={task.id} task={task} onToggle={toggleTask} delay={i * 0.05} />
            ))}
            {todayTasks.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No tasks for today</p>
            )}
          </div>
        </section>

        {upcomingTasks.length > 0 && (
          <section>
            <h2 className="font-display font-semibold mb-3">Upcoming</h2>
            <div className="space-y-3">
              {upcomingTasks.map((task, i) => (
                <TaskCard key={task.id} task={task} onToggle={toggleTask} delay={i * 0.05} />
              ))}
            </div>
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
