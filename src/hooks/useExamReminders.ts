import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNotification } from "./useNotification";
import { differenceInDays, parseISO, format } from "date-fns";

interface Exam {
  id: string;
  title: string;
  exam_date: string;
  subject: string | null;
}

export function useExamReminders(userId: string | undefined) {
  const { notify } = useNotification();

  const checkExamReminders = useCallback(async () => {
    if (!userId) return;

    const { data: exams } = await supabase
      .from("exams")
      .select("*")
      .eq("user_id", userId)
      .gte("exam_date", format(new Date(), "yyyy-MM-dd"))
      .order("exam_date");

    if (!exams) return;

    const today = new Date();
    
    exams.forEach((exam: Exam) => {
      const examDate = parseISO(exam.exam_date);
      const daysUntil = differenceInDays(examDate, today);

      // Check if we should notify
      let shouldNotify = false;
      let message = "";

      if (daysUntil === 0) {
        shouldNotify = true;
        message = `Today is your ${exam.title} exam! Good luck! 🍀`;
      } else if (daysUntil === 1) {
        shouldNotify = true;
        message = `${exam.title} is tomorrow! Make sure you're prepared.`;
      } else if (daysUntil === 3) {
        shouldNotify = true;
        message = `${exam.title} in 3 days. Time to start reviewing!`;
      } else if (daysUntil === 7) {
        shouldNotify = true;
        message = `${exam.title} is in 1 week. Plan your study schedule.`;
      }

      // Check localStorage to avoid repeat notifications
      const notifKey = `exam_notif_${exam.id}_${daysUntil}`;
      const lastNotified = localStorage.getItem(notifKey);
      const todayStr = format(today, "yyyy-MM-dd");

      if (shouldNotify && lastNotified !== todayStr) {
        notify(daysUntil === 0 ? "Exam Day!" : "Exam Reminder", {
          body: message,
          sound: daysUntil <= 1 ? "alarm" : "gentle",
          tag: `exam-${exam.id}`,
        });
        localStorage.setItem(notifKey, todayStr);
      }
    });
  }, [userId, notify]);

  useEffect(() => {
    // Check on mount
    checkExamReminders();

    // Check every hour
    const interval = setInterval(checkExamReminders, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [checkExamReminders]);

  return { checkExamReminders };
}
