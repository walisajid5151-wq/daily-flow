   duration_minutes: number;
   completed: boolean;
   priority: string;
 }
 
 interface Skill {
   id: string;
   name: string;
   target_minutes_daily: number;
   streak_count: number;
   last_practiced_at: string | null;
 }
 
 const MOTIVATIONAL_MESSAGES = [
   "Small steps lead to big wins. You've got this.",
   "Focus on progress, not perfection.",
   "Every task you complete is a win.",
   "Your future self will thank you.",
   "One thing at a time. Start now.",
   "You're closer than you think.",
   "Consistency beats intensity.",
   "Today's effort shapes tomorrow's success.",
 ];
 
 export default function Dashboard() {
-  const { user, loading } = useAuth();
+  const { user, supabaseUser, loading } = useAuth();
   const navigate = useNavigate();
   const { toast } = useToast();
   const { isEndOfDay } = useDaySettings();
 
   const [tasks, setTasks] = useState<Task[]>([]);
   const [skills, setSkills] = useState<Skill[]>([]);
   const [motivationalMessage, setMotivationalMessage] = useState("");
   const [showCelebration, setShowCelebration] = useState(false);
   const [celebrationQuote, setCelebrationQuote] = useState("");
 
   const [showHighPriorityModal, setShowHighPriorityModal] = useState(false);
   const [pendingHighPriorityTask, setPendingHighPriorityTask] = useState<Task | null>(null);
 
   useExamReminders(user?.id);
 
   useEffect(() => {
     if (!loading && !user) navigate("/auth");
   }, [user, loading, navigate]);
 
   useEffect(() => {
-    if (user) {
+    if (supabaseUser) {
       fetchTasks();
       fetchSkills();
       generateMotivation();
     }
-  }, [user]);
+  }, [supabaseUser]);
 
   useEffect(() => {
     if (isEndOfDay() && tasks.length > 0) {
       const incompleteHighPriority = tasks.filter(
         t => !t.completed && t.priority === "high"
       );
 
       if (incompleteHighPriority.length > 0 && !showHighPriorityModal) {
         const lastPrompt = localStorage.getItem("planit-last-hp-prompt");
         const today = format(new Date(), "yyyy-MM-dd");
 
         if (lastPrompt !== today) {
           setPendingHighPriorityTask(incompleteHighPriority[0]);
           setShowHighPriorityModal(true);
           localStorage.setItem("planit-last-hp-prompt", today);
         }
       }
     }
   }, [tasks, isEndOfDay, showHighPriorityModal]);
 
   const fetchTasks = async () => {
-    if (!user) return;
+    if (!supabaseUser) return;
     const today = format(new Date(), "yyyy-MM-dd");
     const { data } = await supabase
       .from("tasks")
       .select("*")
-      .eq("user_id", user.id)
+      .eq("user_id", supabaseUser.id)
       .eq("scheduled_date", today)
       .order("scheduled_time");
     if (data) setTasks(data as Task[]);
   };
 
   const fetchSkills = async () => {
-    if (!user) return;
+    if (!supabaseUser) return;
     const { data } = await supabase
       .from("skills")
       .select("*")
-      .eq("user_id", user.id)
+      .eq("user_id", supabaseUser.id)
       .order("created_at");
     if (data) setSkills(data as Skill[]);
   };
 
   const calculateTotalStreak = () => {
     const today = format(new Date(), "yyyy-MM-dd");
     const allPracticedToday =
       skills.length > 0 &&
       skills.every(s => s.last_practiced_at === today);
 
     if (skills.length === 0) return 0;
 
     const minStreak = Math.min(...skills.map(s => s.streak_count || 0));
     return allPracticedToday ? Math.max(minStreak, 1) : minStreak;
   };
 
   const generateMotivation = () => {
     setMotivationalMessage(
       MOTIVATIONAL_MESSAGES[
         Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)
       ]
     );
   };
 
   const toggleTask = async (id: string, completed: boolean) => {
     const task = tasks.find(t => t.id === id);
     if (!task) return;
 
     await supabase
       .from("tasks")
       .update({
         completed: !completed,
         completed_at: !completed ? new Date().toISOString() : null,
       })
       .eq("id", id);
 
     fetchTasks();
 
     if (!completed) {
       setCelebrationQuote(`"${task.title}" - Done! Keep crushing it.`);
       setShowCelebration(true);
       toast({ title: "Task completed! 🎉" });
     }
   };
 
   const addTask = async (
     title: string,
     type: "daily" | "exam" | "skill",
     scheduledDate: string | null = format(new Date(), "yyyy-MM-dd")
   ) => {
-    if (!user) return;
+    if (!supabaseUser) return;
 
     const { data, error } = await supabase
       .from("tasks")
       .insert([
         {
           title,
           type,
           scheduled_date: scheduledDate,
           completed: false,
-          user_id: user.id,
+          user_id: supabaseUser.id,
           priority: type === "exam" ? "high" : "normal",
         },
       ])
       .select();
 
     if (error) {
       toast({ title: "Failed to add task", description: error.message });
       return null;
     }
 
     fetchTasks();
     toast({ title: "Task added!" });
     return data;
   };
 
   const handleMoveToTomorrow = async () => {
-    if (!pendingHighPriorityTask || !user) return;
+    if (!pendingHighPriorityTask || !supabaseUser) return;
 
     const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");
 
     await supabase
       .from("tasks")
       .update({
         scheduled_date: tomorrow,
         completed: false,
         completed_at: null,
       })
       .eq("id", pendingHighPriorityTask.id);
 
     setShowHighPriorityModal(false);
     setPendingHighPriorityTask(null);
     fetchTasks();
 
     toast({ title: "Task moved to tomorrow" });
   };
 
   const handleSkipTask = () => {
     setShowHighPriorityModal(false);
     setPendingHighPriorityTask(null);
   };
 
   const completedCount = tasks.filter(t => t.completed).length;
@@ -294,54 +294,52 @@ export default function Dashboard() {
             />
             <p className="text-sm text-muted-foreground mt-4">
               Today's Progress
             </p>
           </div>
         </motion.div>
 
         <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.15 }}
           className="quote-card"
         >
           <div className="flex items-start gap-3">
             <Quote className="w-5 h-5 opacity-60 flex-shrink-0 mt-0.5" />
             <p className="text-base font-medium">{motivationalMessage}</p>
           </div>
         </motion.div>
 
         <DaySummaryCard
           completedTasks={completedTasks}
           skippedTasks={skippedTasks}
           isEndOfDay={isEndOfDay()}
         />
 
-        {/* Quick Actions: Call addTask on click */}
         <QuickActions
-          addTask={addTask}
-          userId={user?.id}
+          userId={supabaseUser?.id}
           onRefresh={() => {
             fetchTasks();
             fetchSkills();
           }}
         />
 
         <section>
           <div className="flex items-center justify-between mb-3">
             <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
               <Calendar className="w-4 h-4 text-primary" />
               Today's Tasks
             </h2>
             <Button
               variant="ghost"
               size="sm"
               onClick={() => navigate("/tasks")}
               className="text-primary"
             >
               See all
             </Button>
           </div>
 
           <div className="space-y-3">
             {tasks.length === 0 ? (
               <motion.div
