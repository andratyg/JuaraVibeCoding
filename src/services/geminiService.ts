import { GoogleGenAI } from "@google/genai";
import { Task, EnergyCheckIn, UserProfile, Journal, Workout } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
const MODEL_NAME = "gemini-3-flash-preview";

export const geminiService = {
  async analyzeEnergyCheckIn(energy: number, stress: number, focus: number): Promise<Partial<EnergyCheckIn>> {
    const prompt = `Lakukan analisis energi harian berdasarkan data berikut:
    Energy: ${energy}/10
    Stress: ${stress}/10
    Focus: ${focus}/10
    
    Berikan respon JSON dengan format:
    {
      "score": number (1-10),
      "mode": string ("Deep Work Mode", "Balance Mode", atau "Recovery Mode"),
      "quote": string (kutipan motivasi singkat dalam Bahasa Indonesia yang relevan dengan kondisi),
      "recommendations": string[] (3 tips praktis),
      "explanation": {
        "energy": "penjelasan awam",
        "stress": "penjelasan awam",
        "focus": "penjelasan awam",
        "enthusiasm": "penjelasan awam"
      }
    }`;

    try {
      const result = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      return JSON.parse(result.text);
    } catch (error) {
      console.error("Gemini Error:", error);
      return { score: 5, mode: "Balance Mode", quote: "Tetap semangat hari ini!" };
    }
  },

  async calibrateDaily(userInput: string): Promise<Partial<EnergyCheckIn>> {
    const prompt = `Kamu adalah pakar kalibrasi harian yang empatik.
    User bercerita tentang perasaannya pagi ini: "${userInput}"
    
    Tugas Anda:
    1. Analisis perasaan tersebut menjadi skor numerik (1-10).
    2. Terjemahkan ke bahasa yang mudah dimengerti orang awam.
    3. Untuk Stres: 1 = Sangat Rendah Stres, 10 = Sangat Tinggi Stres.
    
    Kembalikan JSON dengan format:
    {
      "energy": number (1-10),
      "stress": number (1-10),
      "focus": number (1-10),
      "enthusiasm": number (1-10),
      "score": number (1-10, overall productivity potential),
      "mode": string (Nama kategori state: e.g. "Pagi yang Seimbang Optimal", "Perlu Prioritaskan Wellness", dll),
      "quote": string (Kutipan motivasi kustom),
      "explanation": {
        "energy": "Penjelasan singkat skor energi (untuk orang awam)",
        "stress": "Penjelasan singkat skor stres (untuk orang awam)",
        "focus": "Penjelasan singkat skor fokus (untuk orang awam)",
        "enthusiasm": "Penjelasan singkat skor semangat (untuk orang awam)"
      },
      "recommendations": string[] (1-3 rekomendasi tindakan personal untuk mengoptimalkan hari)
    }`;

    try {
      const result = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      return JSON.parse(result.text);
    } catch (error) {
      console.error("Gemini Calibration Error:", error);
      throw error;
    }
  },

  async scheduleTasks(tasks: Task[], energyScore: number, vibeMode: string): Promise<Task[]> {
    const prompt = `Susun jadwal harian (Auto-Scheduler) untuk user dengan detail:
    Energy Score: ${energyScore}/10
    Vibe Mode: ${vibeMode}
    Tasks: ${JSON.stringify(tasks.map(t => ({ title: t.title, duration: t.duration, priority: t.priority, category: t.category })))}
    
    Aturan:
    1. Jika score tinggi (7-10), letakkan task "Deep Work" di pagi hari.
    2. Jika score rendah (1-3), berikan banyak jeda istirahat dan pilih task ringan.
    3. Sesuaikan dengan Vibe Mode.
    
    Kembalikan array task yang sama dengan tambahan field "startTime" (ISO string, mulai jam 08:00 hari ini) dan "endTime" (ISO string). Berikan JSON murni.`;

    try {
      const result = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      const text = result.text;
      return JSON.parse(text);
    } catch (error) {
      console.error("Gemini Error:", error);
      return tasks;
    }
  },

  async summarizeDocument(text: string): Promise<any> {
    const prompt = `Ringkas dokumen berikut:
    "${text}"
    
    Berikan respon JSON:
    {
      "summary": "Ringkasan eksekutif 3-5 kalimat",
      "keyPoints": ["point 1", "point 2", ...],
      "actionItems": ["action 1", "action 2", ...],
      "timeSaved": "Estimasi menit yang dihemat"
    }`;

    try {
      const result = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      return JSON.parse(result.text);
    } catch (error) {
      console.error("Gemini Error:", error);
      return { summary: "Gagal meringkas dokumen.", keyPoints: [], actionItems: [], timeSaved: "0" };
    }
  },

  async generateFitnessProgram(profile: any, energyScore: number, mode: string): Promise<Partial<Workout>> {
    const prompt = `Generate program latihan fitness harian personal (Bahasa Indonesia):
    Profile: ${JSON.stringify(profile)}
    Energy Score: ${energyScore}/10
    Vibe Mode: ${mode}
    
    Berikan JSON:
    {
      "name": "Nama Program",
      "exercises": [{ "name": "...", "sets": number, "reps": "...", "description": "..." }],
      "duration": number (menit)
    }`;

    try {
      const result = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      return JSON.parse(result.text);
    } catch (error) {
      console.error("Gemini Error:", error);
      return { name: "Stretching Ringan", exercises: [], duration: 15 };
    }
  },

  async generateJournalResponse(entry: string): Promise<string> {
    const prompt = `Sebagai AI Life Coach empatik, berikan respon singkat (2-3 kalimat) terhadap jurnal berikut dan 1 pertanyaan refleksi mendalam untuk dipikirkan besok. Bahasa Indonesia.
    Jurnal: "${entry}"`;

    try {
      const result = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt
      });
      return result.text;
    } catch (error) {
      return "Terima kasih sudah berbagi hari ini. Mari kita istirahat sejenak.";
    }
  },

  async chatWithCoach(message: string, context: any): Promise<string> {
    const toneDescription = {
      balanced: "seimbang, profesional, dan empatik",
      tough: "tegas, disiplin, berorientasi hasil, dan tidak basa-basi (tough love)",
      supportive: "sangat mendukung, penyabar, hangat, dan penuh kasih sayang",
      stoic: "tenang, logis, fokus pada kendali diri, dan filosofis (stoicism)"
    }[context.tone as keyof typeof toneDescription] || "personal, actionable, dan empatik";

    const prompt = `Kamu adalah AI Life Coach di FlowState. Kamu memahami kondisi user ( wellness + produktivitas).
    Persona kamu saat ini adalah: ${toneDescription}.
    
    User Data Context: ${JSON.stringify(context)}
    User Message: "${message}"
    
    Berikan respon sesuai dengan persona tersebut dalam Bahasa Indonesia.`;

    try {
      const result = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt
      });
      return result.text;
    } catch (error) {
      return "Maaf, aku sedang mengalami gangguan koneksi. Ada yang bisa aku bantu?";
    }
  }
};
