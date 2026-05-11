import { useState, useEffect, useCallback } from 'react';
import { collection, doc, getDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../config/firebase';

export const useDashboardData = (userId: string | null | undefined) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const today = new Date().toISOString().split('T')[0];
      const userRef = `users/${userId}`;

      // Parallel fetch all required data
      let checkinSnap, tasksSnap, checkins7Snap, reflectionSnap;
      
      try {
        console.log(`Fetching dashboard data for user: ${userId}, path: ${userRef}`);
        
        const fetchCheckin = getDoc(doc(db, userRef, 'checkins', today)).catch(e => { 
          if (e.message?.includes('offline')) {
            console.warn('Checkin fetch: client is offline, using cache if available');
          } else {
            console.error('Checkin fetch failed:', e);
          }
          if (e.code === 'permission-denied') {
            handleFirestoreError(e, OperationType.GET, `${userRef}/checkins/${today}`);
          }
          return { exists: () => false, data: () => null } as any; 
        });

        const fetchTasks = getDocs(query(
          collection(db, userRef, 'tasks'),
          where('date', '==', today)
        )).catch(e => { 
          if (e.message?.includes('offline')) {
            console.warn('Tasks fetch: client is offline');
          } else {
            console.error('Tasks fetch failed:', e);
          }
          if (e.code === 'permission-denied') {
            handleFirestoreError(e, OperationType.LIST, `${userRef}/tasks`);
          }
          return { docs: [], empty: true } as any;
        });

        const fetchHistory = getDocs(query(
          collection(db, userRef, 'checkins'),
          orderBy('date', 'desc'),
          limit(7)
        )).catch(e => { 
          if (e.message?.includes('offline')) {
            console.warn('History fetch: client is offline');
          } else {
            console.error('History fetch failed:', e);
          }
          if (e.code === 'permission-denied') {
            handleFirestoreError(e, OperationType.LIST, `${userRef}/checkins`);
          }
          return { docs: [], empty: true } as any;
        });

        const fetchReflection = getDoc(doc(db, userRef, 'reflections', today)).catch(e => { 
          if (e.message?.includes('offline')) {
            console.warn('Reflection fetch: client is offline');
          } else {
            console.error('Reflection fetch failed:', e);
          }
          if (e.code === 'permission-denied') {
            handleFirestoreError(e, OperationType.GET, `${userRef}/reflections/${today}`);
          }
          return { exists: () => false, data: () => null } as any;
        });

        [checkinSnap, tasksSnap, checkins7Snap, reflectionSnap] = await Promise.all([
          fetchCheckin, fetchTasks, fetchHistory, fetchReflection
        ]);
      } catch (err: any) {
        console.error('Dashboard primary fetch failed:', err);
        // The individual catches already handle conversion if critical
        setError(err.message || 'Gagal memuat data dashboard');
      }

      // Calculate streak
      const checkinDates = checkins7Snap.docs.map(d => d.id).sort().reverse();
      let streak = 0;
      for (let i = 0; i < checkinDates.length; i++) {
        const expected = new Date();
        expected.setDate(expected.getDate() - i);
        const expectedStr = expected.toISOString().split('T')[0];
        if (checkinDates[i] === expectedStr) streak++;
        else break;
      }

      const taskList = tasksSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const checkins = checkins7Snap.docs.map(d => ({ date: d.id, ...d.data() as any }));
      const todayCheckin = checkinSnap.exists() ? checkinSnap.data() : null;

      setData({
        todayCheckin,
        hasCheckedIn: checkinSnap.exists(),
        energyScore: todayCheckin?.energyScore ?? null,
        mode: todayCheckin?.mode ?? null,
        colorTheme: todayCheckin?.colorTheme ?? 'purple',
        tasks: taskList,
        completedTasks: taskList.filter((t: any) => t.completed).length,
        totalTasks: taskList.length,
        streak,
        recentCheckins: checkins,
        hasReflectedToday: reflectionSnap.exists(),
        weeklyEnergy: checkins.map((c: any) => ({ date: c.date, score: c.energyScore || 0 })).reverse()
      });
    } catch (err: any) {
      console.error('Dashboard fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};
