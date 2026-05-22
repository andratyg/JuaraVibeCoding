import { db } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';

export const DAILY_LIMIT = 50;

export const checkRateLimit = async (userId: string) => {
  if (!userId) return { allowed: true, remaining: DAILY_LIMIT };
  const today = new Date().toISOString().split('T')[0];
  const ref = doc(db, 'users', userId, 'usage', today);
  
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { count: 1, date: today });
    return { allowed: true, remaining: DAILY_LIMIT - 1 };
  }
  
  const currentCount = snap.data().count || 0;
  if (currentCount >= DAILY_LIMIT) {
    throw new Error('Limit harian AI telah tercapai. Coba lagi besok.');
  }
  
  await updateDoc(ref, { count: increment(1) });
  return { allowed: true, remaining: DAILY_LIMIT - currentCount - 1 };
};
