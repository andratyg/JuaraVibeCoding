import { doc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const today = () => new Date().toISOString().split('T')[0];
const base  = (uid: string) => `users/${uid}`;

// Simpan hasil check-in
export const saveCheckin = (uid: string, result: any, raw: any) =>
  setDoc(doc(db, base(uid), 'checkins', today()), {
    ...result, ...raw, date: today(), createdAt: serverTimestamp()
  });

// Simpan jadwal task
export const saveTaskSchedule = (uid: string, schedule: any) =>
  setDoc(doc(db, base(uid), 'schedules', today()), {
    schedule, date: today(), createdAt: serverTimestamp()
  });

// Simpan program fitness
export const saveFitnessProgram = (uid: string, program: any) =>
  setDoc(doc(db, base(uid), 'fitness', today()), {
    ...program, date: today(), createdAt: serverTimestamp()
  });

// Simpan jurnal
export const saveJournal = (uid: string, entry: any, aiResponse: any) =>
  setDoc(doc(db, base(uid), 'journals', today()), {
    ...entry, aiResponse, date: today(), createdAt: serverTimestamp()
  });

// Simpan ringkasan dokumen ke history
export const saveSummary = (uid: string, input: string, result: any) =>
  addDoc(collection(db, base(uid), 'summaries'), {
    input: input.substring(0, 200), result, createdAt: serverTimestamp()
  });
