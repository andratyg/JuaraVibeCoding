import { useState, useEffect, useCallback } from 'react'
import { collection, doc, getDoc, getDocs, query, orderBy, limit } from 'firebase/firestore'
import { db } from '../config/firebase'

export const useDashboardData = (userId: string | null | undefined) => {
  const [data,    setData]    = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!userId) { setLoading(false); return }
    setLoading(true); setError(null)
    try {
      const today = new Date().toISOString().split('T')[0]
      const base  = `users/${userId}`

      // Parallel fetch — FIX C1: real-time dashboard from Firestore
      const [checkinSnap, checkins7, tasksSnap] = await Promise.all([
        getDoc(doc(db, base, 'checkins', today)),
        getDocs(query(collection(db, base, 'checkins'), orderBy('date','desc'), limit(7))),
        getDocs(query(collection(db, base, 'tasks'), orderBy('createdAt', 'desc'), limit(10)))
      ])

      // FIX C2: Streak calculation yang benar
      const checkinDocs = checkins7.docs.map(d => ({ date: d.id, ...d.data() as any }))
      let streak = 0
      for (let i = 0; i < checkinDocs.length; i++) {
        const exp = new Date(); 
        exp.setDate(exp.getDate() - i);
        const expStr = exp.toISOString().split('T')[0];
        // Note: document ID is the date string
        const found = checkinDocs.find(d => d.date === expStr);
        if (found) streak++
        else break
      }

      const today_data = checkinSnap.exists() ? checkinSnap.data() : null
      const taskList = tasksSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
      const todayTasks = taskList.filter((t: any) => t.date === today);

      setData({
        todayCheckin:   today_data,
        hasCheckedIn:   checkinSnap.exists(),
        energyScore:    today_data?.energyScore ?? null,
        mode:           today_data?.mode ?? null,
        colorTheme:     today_data?.colorTheme ?? 'purple',
        narasi:         today_data?.narasi ?? null,
        tasks:          taskList,
        completedTasks: todayTasks.filter((t: any) => t.completed).length,
        totalTasks:     todayTasks.length,
        streak,
        recentCheckins: checkinDocs,
        weeklyEnergy:   checkinDocs.map(c => ({ date: c.date, score: c.energyScore || 0 })).reverse()
      })
    } catch (e: any) { 
      console.error('Dashboard fetch error:', e);
      setError(e.message) 
    }
    finally { setLoading(false) }
  }, [userId])

  useEffect(() => { fetch() }, [fetch])
  return { data, loading, error, refetch: fetch }
}
