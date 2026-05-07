import { GoogleGenerativeAI } from "@google/generative-ai";
import { Task, UserProfile } from "../types/index";

const GEMINI_API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || (process as any).env?.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const MODEL_NAME = "gemini-2.0-flash";

const callGeminiJSON = async (prompt: string, systemInstruction: string = '') => {
  try {
    const model = genAI.getGenerativeModel({ 
      model: MODEL_NAME,
      systemInstruction: systemInstruction || undefined
    });
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { 
        temperature: 0.7, 
        maxOutputTokens: 2048,
        responseMimeType: "application/json"
      }
    });

    const response = await result.response;
    const text = response.text();
    return JSON.parse(text.trim());
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
};

export const geminiService = {
  async calibrateDaily(userInput: string) {
    const prompt = `Kamu adalah pakar kalibrasi harian yang empatik.
    User bercerita tentang perasaannya pagi ini: "${userInput}"
    
    Tugas Anda:
    1. Analisis perasaan tersebut menjadi skor numerik (1-10).
    2. Terjemahkan ke bahasa yang mudah dimengerti orang awam.
    
    Kembalikan JSON dengan format:
    {
      "energy": number (1-10),
      "stress": number (1-10),
      "focus": number (1-10),
      "enthusiasm": number (1-10),
      "score": number (1-10),
      "mode": "string",
      "quote": "string",
      "explanation": {
        "energy": "string",
        "stress": "string",
        "focus": "string",
        "enthusiasm": "string"
      },
      "recommendations": ["string"]
    }`;
    return await callGeminiJSON(prompt);
  },

  async analyzeEnergyCheckIn(energi: number, stres: number, fokus: number, mood: string) {
    const prompt = `
    User check-in pagi hari:
    - Level energi: ${energi}/10
    - Level stres: ${stres}/10  
    - Tingkat fokus: ${fokus}/10
    - Mood: ${mood}
    
    Berikan JSON response dengan format:
    {
      "energyScore": <angka 1-10>,
      "mode": "<Deep Work Mode | Balance Mode | Recovery Mode>",
      "modeReason": "<1 kalimat alasan pemilihan mode>",
      "narasi": "<2-3 kalimat personal, empati, dan actionable dalam Bahasa Indonesia>",
      "topTip": "<1 tips spesifik untuk hari ini>",
      "workHours": "<rekomendasi jam kerja, contoh: 09:00-12:00 dan 14:00-17:00>",
      "explanation": {
        "energy": "penjelasan singkat",
        "stress": "penjelasan singkat",
        "focus": "penjelasan singkat"
      },
      "quote": "kutipan motivasi singkat",
      "recommendations": ["tips 1", "tips 2", "tips 3"]
    }
    Kembalikan HANYA JSON.`;
    return await callGeminiJSON(prompt);
  },

  async scheduleTasks(tasks: Task[], energyScore: number, workHours: string) {
    const taskList = tasks.map((t, i) => `${i+1}. ${t.title} (${t.duration} menit, prioritas: ${t.priority})`).join('\n');
    const prompt = `
    Energy Score user hari ini: ${energyScore}/10
    Jam kerja: ${workHours}
    Daftar task:
    ${taskList}
    
    Susun jadwal optimal. Kembalikan JSON:
    {
      "schedule": [
        { "taskName": "", "startTime": "HH:MM", "endTime": "HH:MM", "reason": "" }
      ],
      "totalWorkload": "<ringan|sedang|berat>",
      "overloadWarning": "<null atau string peringatan jika terlalu banyak>"
    }
    Hanya JSON.`;
    return await callGeminiJSON(prompt);
  },

  async generateFitnessProgram(profile: any, energyScore: number, mode: string = 'balance') {
    const fitness = profile.fitnessProfile || {};
    const prompt = `
    Profil user: tinggi ${fitness.height || 170}cm, berat ${fitness.weight || 70}kg, tujuan: ${fitness.goal || 'general fitness'}, level: ${fitness.level || 'beginner'}, equipment: ${fitness.equipment?.join(', ') || 'no equipment'}
    Energy Score hari ini: ${energyScore}/10
    Vibe Mode: ${mode}
    
    Buat program latihan hari ini. Kembalikan JSON:
    {
      "name": "<nama program>",
      "duration": number,
      "intensity": "<ringan|sedang|tinggi>",
      "exercises": [
        { "name": "", "sets": 0, "reps": "", "duration": "", "description": "" }
      ],
      "warmup": "<instruksi warmup singkat>",
      "cooldown": "<instruksi cooldown singkat>",
      "calories": "<estimasi kalori terbakar>"
    }
    Hanya JSON.`;
    return await callGeminiJSON(prompt);
  },

  async generateNudge(energyScore: number, stressLevel: number, timeOfDay: string) {
    const prompt = `
    User butuh micro-break setelah 90 menit kerja.
    Energy Score: ${energyScore}/10, Stres: ${stressLevel}/10, Waktu: ${timeOfDay}
    
    Berikan aktivitas 2-3 menit yang personal. Kembalikan JSON:
    {
      "activity": "<nama aktivitas>",
      "duration": "<durasi>",
      "instruction": "<langkah-langkah singkat>",
      "type": "<breathing|stretching|movement|mindfulness>",
      "benefit": "<manfaat singkat>"
    }
    Hanya JSON.`;
    return await callGeminiJSON(prompt);
  },

  async generateJournalResponse(entry: any) {
    const prompt = `
    User menulis jurnal harian:
    Rating hari: ${entry.rating}/5
    Highlight: ${entry.highlight}
    Tantangan: ${entry.challenge}
    Catatan bebas: ${entry.freeWrite || '-'}
    
    Berikan respons sebagai wellness coach. Kembalikan JSON:
    {
      "response": "<2-3 kalimat empati dan apresiatif>",
      "emotionTags": ["<tag1>", "<tag2>", "<tag3>"],
      "reflectionQuestion": "<1 pertanyaan mendalam untuk direnungkan besok>",
      "affirmation": "<1 kalimat afirmasi positif>"
    }
    Hanya JSON.`;
    return await callGeminiJSON(prompt);
  },

  async generateWeeklyInsight(weeklyData: any) {
    const prompt = `
    Data mingguan user:
    ${JSON.stringify(weeklyData, null, 2)}
    
    Analisis dan berikan insight. Kembalikan JSON:
    {
      "summary": "<ringkasan 2-3 kalimat tentang minggu ini>",
      "bestDay": "<hari terbaik dan alasannya>",
      "pattern": "<pola yang ditemukan>",
      "recommendation": "<1 rekomendasi spesifik untuk minggu depan>",
      "productivityScore": <angka 1-100>,
      "wellnessScore": <angka 1-100>
    }
    Hanya JSON.`;
    return await callGeminiJSON(prompt);
  },

  async checkBurnoutRisk(recentCheckins: any[]) {
    const prompt = `
    Data check-in 7 hari terakhir user: ${JSON.stringify(recentCheckins)}
    
    Analisis risiko burnout. Kembalikan JSON:
    {
      "riskLevel": "<low|medium|high|critical>",
      "riskScore": <angka 0-100>,
      "triggers": ["<trigger1>", "<trigger2>"],
      "recoveryPlan": {
        "immediate": ["<langkah hari ini>"],
        "shortTerm": ["<langkah 3-7 hari>"],
        "longTerm": "<saran jangka panjang>"
      },
      "message": "<pesan empatik langsung ke user>"
    }
    Hanya JSON.`;
    return await callGeminiJSON(prompt);
  },

  async chatWithCoach(message: string, context: any) {
    const systemInstruction = `Kamu adalah FlowState AI Coach — asisten wellness dan produktivitas yang empatik, personal, and actionable. 
    Konteks user: Energy Score ${context.energyScore}/10, ${context.tasksToday} task hari ini, mood: ${context.mood}.
    Jawab dalam Bahasa Indonesia, hangat, dan berikan saran konkret.`;
    
    const model = genAI.getGenerativeModel({ model: MODEL_NAME, systemInstruction });
    const result = await model.generateContent(message);
    const response = await result.response;
    return response.text();
  },

  async summarizeDocument(text: string, format: 'bullet' | 'narrative' | 'executive' | 'qa' = 'bullet') {
    const formatGuide = {
      bullet: 'poin-poin singkat',
      narrative: 'narasi paragraf ringkas',
      executive: 'executive summary formal',
      qa: 'format tanya-jawab Q&A'
    };
    const prompt = `
    Ringkas dokumen berikut dalam format ${formatGuide[format]}:
    
    ${text.substring(0, 30000)}
    
    Kembalikan JSON:
    {
      "summary": "<ringkasan utama>",
      "keyPoints": ["<poin1>", "<poin2>", "<poin3>"],
      "actionItems": ["<action1>", "<action2>"],
      "readingTimeSaved": "<estimasi menit>",
      "wordCount": ${text.split(/\s+/).length}
    }
    Hanya JSON.`;
    return await callGeminiJSON(prompt);
  }
};

