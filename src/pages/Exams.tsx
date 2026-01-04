import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { BottomNav } from "@/components/BottomNav";
import { ArrowLeft, Plus, BookOpen, Calendar, Clock, Trash2 } from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface Exam {
  id: string;
  title: string;
  subject: string | null;
  exam_date: string;
  exam_time: string | null;
}

export default function Exams() {
  const { user, supabaseUser, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newExam, setNewExam] = useState({ title: "", subject: "", date: "", time: "" });

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (supabaseUser) fetchExams();
  }, [supabaseUser]);

  const fetchExams = async () => {
    if (!supabaseUser) return;
    const { data } = await supabase
      .from("exams")
      .select("*")
      .eq("user_id", supabaseUser.id)
      .order("exam_date");
    if (data) setExams(data);
  };

  const addExam = async () => {
    if (!newExam.title.trim() || !newExam.date || !supabaseUser) return;
    const { error } = await supabase.from("exams").insert({
      user_id: supabaseUser.id,
      title: newExam.title,
      subject: newExam.subject || null,
      exam_date: newExam.date,
      exam_time: newExam.time || null
    });
    if (error) {
      toast({ title: "Failed to add exam", description: error.message });
      return;
    }
    setNewExam({ title: "", subject: "", date: "", time: "" });
    setIsOpen(false);
    fetchExams();
    toast({ title: "Exam added!" });
  };

  const deleteExam = async (id: string) => {
    if (!supabaseUser) return;
    await supabase.from("exams").delete().eq("id", id);
    fetchExams();
    toast({ title: "Exam deleted" });
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-gradient-hero pb-24">
      <header className="p-4 pt-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-display font-bold">Exams</h1>
      </header>

      <main className="px-4 space-y-4">
        <div className="flex justify-end">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1"><Plus className="w-4 h-4" /> Add Exam</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Exam</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <Input
                  placeholder="Exam title"
                  value={newExam.title}
                  onChange={(e) => setNewExam({ ...newExam, title: e.target.value })}
                />
                <Input
                  placeholder="Subject (optional)"
                  value={newExam.subject}
                  onChange={(e) => setNewExam({ ...newExam, subject: e.target.value })}
                />
                <Input
                  type="date"
                  value={newExam.date}
                  onChange={(e) => setNewExam({ ...newExam, date: e.target.value })}
                />
                <Input
                  type="time"
                  value={newExam.time}
                  onChange={(e) => setNewExam({ ...newExam, time: e.target.value })}
                />
                <Button className="w-full" onClick={addExam}>Add Exam</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {exams.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 text-muted-foreground"
          >
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No exams scheduled</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {exams.map((exam, i) => {
              const daysLeft = differenceInDays(new Date(exam.exam_date), new Date());
              const isUrgent = daysLeft <= 3 && daysLeft >= 0;
              
              return (
                <motion.div
                  key={exam.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`glass-card p-4 border ${isUrgent ? 'border-destructive/50' : 'border-border/50'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{exam.title}</h3>
                      {exam.subject && (
                        <p className="text-sm text-muted-foreground">{exam.subject}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(new Date(exam.exam_date), "MMM d, yyyy")}
                        </span>
                        {exam.exam_time && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {exam.exam_time}
                          </span>
                        )}
                      </div>
                      {daysLeft >= 0 && (
                        <p className={`text-xs mt-2 ${isUrgent ? 'text-destructive' : 'text-primary'}`}>
                          {daysLeft === 0 ? "Today!" : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => deleteExam(exam.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
