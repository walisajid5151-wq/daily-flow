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
-  const { user, loading } = useAuth();
+  const { user, supabaseUser, loading } = useAuth();
   const navigate = useNavigate();
   const { toast } = useToast();
   const [exams, setExams] = useState<Exam[]>([]);
   const [isOpen, setIsOpen] = useState(false);
   const [newExam, setNewExam] = useState({ title: "", subject: "", date: "", time: "" });
 
   useEffect(() => {
     if (!loading && !user) navigate("/auth");
   }, [user, loading, navigate]);
 
   useEffect(() => {
-    if (user) fetchExams();
-  }, [user]);
+    if (supabaseUser) fetchExams();
+  }, [supabaseUser]);
 
   const fetchExams = async () => {
-    const { data } = await supabase.from("exams").select("*").order("exam_date");
+    if (!supabaseUser) return;
+    const { data } = await supabase.from("exams").select("*").eq("user_id", supabaseUser.id).order("exam_date");
     if (data) setExams(data);
   };
 
   const addExam = async () => {
     if (!newExam.title.trim() || !newExam.date) return;
-    await supabase.from("exams").insert({
-      user_id: user!.id,
+    const { error } = await supabase.from("exams").insert({
+      user_id: supabaseUser!.id,
       title: newExam.title,
       subject: newExam.subject || null,
       exam_date: newExam.date,
       exam_time: newExam.time || null
     });
+    if (error) {
+      toast({ title: "Failed to add exam", description: error.message });
+      return;
+    }
     setNewExam({ title: "", subject: "", date: "", time: "" });
     setIsOpen(false);
     fetchExams();
     toast({ title: "Exam added!" });
   };
 
   const deleteExam = async (id: string) => {
+    if (!supabaseUser) return;
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

