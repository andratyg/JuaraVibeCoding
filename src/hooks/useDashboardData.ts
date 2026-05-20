import { useState, useEffect } from 'react';
import { collection, doc, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

export const useDashboardData = (userId: string | null | undefined) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const today = new Date().toISOString().split('T')[0];
    const base = `users/${userId}`;

    // Realtime listeners
    const unsubCheckin = onSnapshot(doc(db, base, 'checkins', today), (checkinSnap) => {
      const today_data = checkinSnap.exists() ? checkinSnap.data() : null;
      setData((prev: any) => ({
        ...prev,
        todayCheckin: today_data,
        hasCheckedIn: checkinSnap.exists(),
        energyScore: today_data?.energyScore ?? null,
        mode: today_data?.mode ?? null,
        colorTheme: today_data?.colorTheme ?? 'purple',
        narasi: today_data?.narasi ?? null,
      }));
    }, (e) => setError(e.message));

    const unsubCheckins7 = onSnapshot(query(collection(db, base, 'checkins'), orderBy('date', 'desc'), limit(7)), (checkinsSnap) => {
      const checkinDocs = checkinsSnap.docs.map(d => ({ date: d.id, ...d.data() as any }));
      // FIX C2: Streak calculation yang benar
      let streak = 0;
      for (let i = 0; i < 7; i++) {
        const exp = new Date();
        exp.setDate(exp.getDate() - i);
        const expStr = exp.toISOString().split('T')[0];
        const found = checkinDocs.find(d => d.date === expStr);
        if (found) streak++;
        else break; // Streak terputus
      }

      setData((prev: any) => ({
        ...prev,
        streak,
        recentCheckins: checkinDocs,
        weeklyEnergy: checkinDocs.map(c => ({ date: c.date, score: c.energyScore || 0 })).reverse(),
      }));
    }, (e) => setError(e.message));

    const unsubTasks = onSnapshot(query(collection(db, base, 'tasks'), orderBy('createdAt', 'desc'), limit(10)), (tasksSnap) => {
      const taskList = tasksSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
      const todayTasks = taskList.filter((t: any) => {
        // If task has date field, string matching. Otherwise maybe parse it
        return t.date === today || (t.createdAt && new Date(t.createdAt.toMillis ? t.createdAt.toMillis() : t.createdAt).toISOString().split('T')[0] === today);
      });
      setData((prev: any) => ({
        ...prev,
        tasks: taskList,
        completedTasks: todayTasks.filter((t: any) => t.status === 'Completed' || t.completed).length,
        totalTasks: todayTasks.length,
      }));
    }, (e) => setError(e.message));
    
    setLoading(false);

    return () => {
      unsubCheckin();
      unsubCheckins7();
      unsubTasks();
    };
  }, [userId]);

  return { data, loading, error };
};
