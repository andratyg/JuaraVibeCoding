import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

// In AI Studio, the API key is provided via process.env.GEMINI_API_KEY
const API_KEY = process.env.GEMINI_API_KEY || '';

const ai = new GoogleGenAI({ apiKey: API_KEY });
const DEFAULT_MODEL = 'gemini-3-flash-preview';

/**
 * Robustly call Gemini and handle JSON responses
 */
const callGemini = async (prompt: string, systemInstruction = '', responseSchema?: any): Promise<any> => {
  try {
    const isJson = !!responseSchema;
    
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 2048,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        ...(isJson && { responseMimeType: 'application/json' }),
        ...(responseSchema && { responseSchema }),
        ...(systemInstruction && { systemInstruction })
      }
    });

    const text = response.text;
    if (!text) throw new Error('AI returned an empty response.');
    
    if (!isJson) return text.trim();
    
    try {
      const cleaned = text.replace(/```json\n?|```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch (parseErr: any) {
      console.error('JSON Parse Error. Raw text:', text);
      // Attempt to fix common truncation/malformation if it's minor?
      // For now, just throw a clearer error
      throw new Error(`Failed to parse AI response as JSON: ${parseErr.message}`);
    }
  } catch (err: any) {
    console.error('Gemini API Invocation Error:', err);
    throw err;
  }
};

export const geminiService = {
  analyzeEnergyCheckIn: async (energi: number, stres: number, fokus: number, mood: string) => {
    const prompt = `Analisis data check-in user:
Energi Fisik: ${energi}/10
Stres Mental: ${stres}/10
Fokus: ${fokus}/10
Mood: "${mood}"

Berikan ringkasan energi hari ini dan mode kerja yang direkomendasikan.`;

    const systemInstruction = `Kamu adalah Pulse AI Wellness Coach yang empatik. Kamu menganalisis data energi user dan memberikan strategi harian. 
Balas SELALU dalam Bahasa Indonesia yang natural dan hangat. 
Gunakan JSON untuk menjawab.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        energyScore: { type: Type.NUMBER, description: "Skor rata-rata energi (1-10)" },
        mode: { type: Type.STRING, description: "Mode kerja (Deep Work Mode, Balance Mode, atau Recovery Mode)" },
        modeReason: { type: Type.STRING, description: "Alasan singkat pemilihan mode" },
        narasi: { type: Type.STRING, description: "Catatan pendek dan suportif (2-3 kalimat)" },
        topTip: { type: Type.STRING, description: "Tips praktis untuk hari ini" },
        workSlots: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "Daftar slot waktu produktif (misal: ['09:00-11:00', '14:00-16:00'])" 
        },
        avoidSlots: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "Waktu istirahat atau downtime" 
        },
        colorTheme: { type: Type.STRING, description: "Tema warna (teal, purple, amber)" },
        emoji: { type: Type.STRING, description: "Emoji representasi" }
      },
      required: ["energyScore", "mode", "modeReason", "narasi", "topTip", "workSlots", "avoidSlots", "colorTheme", "emoji"]
    };

    return callGemini(prompt, systemInstruction, responseSchema);
  },

  scheduleTasks: async (tasks: any[], energyScore: number, workSlots: string[] | string) => {
    const taskList = tasks.map((t, i) =>
      `${i + 1}. "${t.title || t.name}" — ${t.duration} menit, prioritas: ${t.priority}, kategori: ${t.category || 'general'}`
    ).join('\n');
    const slotsString = Array.isArray(workSlots) ? workSlots.join(', ') : workSlots;
    const prompt = `Energy Score: ${energyScore}/10. Slot kerja: ${slotsString}.
Tugas yang harus dijadwalkan:
${taskList}`;

    const systemInstruction = `Susun jadwal kerja hari ini. Tugas berat di slot pagi/energi tinggi, tugas ringan di sore.
Gunakan Bahasa Indonesia yang natural. 
Balas dalam format JSON.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        schedule: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              taskId: { type: Type.NUMBER },
              taskName: { type: Type.STRING },
              startTime: { type: Type.STRING, description: "HH:MM" },
              endTime: { type: Type.STRING, description: "HH:MM" },
              reason: { type: Type.STRING }
            },
            required: ["taskId", "taskName", "startTime", "endTime"]
          }
        },
        totalMinutes: { type: Type.NUMBER },
        overloadWarning: { type: Type.STRING, nullable: true },
        suggestedBreaks: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["schedule", "totalMinutes", "suggestedBreaks"]
    };

    return callGemini(prompt, systemInstruction, responseSchema);
  },

  generateFitnessProgram: async (profile: any, energyScore: number) => {
    const prompt = `Profil: ${profile.height}cm, ${profile.weight}kg, Goal: ${profile.goal}, Level: ${profile.level}.
Equipment: ${(profile.equipment || ['Bodyweight']).join(', ')}. Energy Score: ${energyScore}/10.`;

    const systemInstruction = `Buat program latihan fitness yang sesuai dengan profil dan level energi user hari ini.
Balas dalam Bahasa Indonesia yang natural dan actionable.
Gunakan format JSON.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        totalDuration: { type: Type.NUMBER },
        intensity: { type: Type.STRING },
        estimatedCalories: { type: Type.NUMBER },
        warmup: {
          type: Type.OBJECT,
          properties: {
            duration: { type: Type.NUMBER },
            description: { type: Type.STRING }
          },
          required: ["duration", "description"]
        },
        exercises: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              sets: { type: Type.NUMBER },
              reps: { type: Type.STRING },
              restSeconds: { type: Type.NUMBER },
              muscleGroup: { type: Type.STRING },
              formTip: { type: Type.STRING },
              modification: { type: Type.STRING }
            },
            required: ["name", "sets", "reps", "restSeconds", "muscleGroup", "formTip"]
          }
        },
        cooldown: {
          type: Type.OBJECT,
          properties: {
            duration: { type: Type.NUMBER },
            description: { type: Type.STRING }
          },
          required: ["duration", "description"]
        },
        motivationalMessage: { type: Type.STRING }
      },
      required: ["totalDuration", "intensity", "estimatedCalories", "warmup", "exercises", "cooldown", "motivationalMessage"]
    };

    return callGemini(prompt, systemInstruction, responseSchema);
  },

  generateNudge: async (energyScore: number, stressLevel: number, timeOfDay: string) => {
    const prompt = `Energy: ${energyScore}/10, Stres: ${stressLevel}/10, Waktu: ${timeOfDay}.
User butuh micro-break 2-3 menit.`;

    const systemInstruction = `Berikan aktivitas micro-break yang tepat. 
Balas dalam Bahasa Indonesia yang natural. Format JSON.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        activity: { type: Type.STRING },
        type: { type: Type.STRING },
        durationMinutes: { type: Type.NUMBER },
        steps: { type: Type.ARRAY, items: { type: Type.STRING } },
        benefit: { type: Type.STRING },
        emoji: { type: Type.STRING }
      },
      required: ["activity", "type", "durationMinutes", "steps", "benefit", "emoji"]
    };

    return callGemini(prompt, systemInstruction, responseSchema);
  },

  generateJournalResponse: async (entry: any) => {
    const prompt = `Jurnal:
Rating: ${entry.rating}/5
Highlight: "${entry.highlight}"
Tantangan: "${entry.challenge}"
Catatan: "${entry.freeWrite || ''}"`;

    const systemInstruction = `Berikan respons sebagai coach yang empatik dan bijak terhadap jurnal user.
Balas dalam Bahasa Indonesia yang hangat. Format JSON.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        response: { type: Type.STRING },
        emotionTags: { type: Type.ARRAY, items: { type: Type.STRING } },
        primaryMood: { type: Type.STRING },
        reflectionQuestion: { type: Type.STRING },
        affirmation: { type: Type.STRING },
        insight: { type: Type.STRING }
      },
      required: ["response", "emotionTags", "primaryMood", "reflectionQuestion", "affirmation", "insight"]
    };

    return callGemini(prompt, systemInstruction, responseSchema);
  },  generateWeeklyInsight: async (weeklyData: any[]) => {
    const summary = weeklyData.map(d =>
      `${d.date}: Energi=${d.energyScore}, Task=${d.completedTasks}/${d.totalTasks}, Mood=${d.mood}`
    ).join('\n');
    const prompt = `Data 7 hari terakhir:
${summary}`;

    const systemInstruction = `Berikan insight performa mingguan user.
Balas dalam Bahasa Indonesia yang informatif. Format JSON.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING },
        bestDay: { type: Type.STRING },
        worstDay: { type: Type.STRING },
        productivityPattern: { type: Type.STRING },
        wellnessPattern: { type: Type.STRING },
        topAchievement: { type: Type.STRING },
        recommendation: { type: Type.STRING },
        productivityScore: { type: Type.NUMBER },
        wellnessScore: { type: Type.NUMBER },
        nextWeekFocus: { type: Type.STRING }
      },
      required: ["summary", "bestDay", "worstDay", "productivityScore", "wellnessScore"]
    };

    return callGemini(prompt, systemInstruction, responseSchema);
  },

  checkBurnoutRisk: async (recentCheckins: any[]) => {
    const data = recentCheckins.map(c =>
      `${c.date}: energi=${c.energi || c.energyScore}, stres=${c.stres}, fokus=${c.fokus}, mood="${c.mood}"`
    ).join('\n');
    const prompt = `Data check-in:
${data}

Analisis risiko burnout.`;

    const systemInstruction = `Analisis risiko burnout berdasarkan tren data check-in user.
Balas dalam Bahasa Indonesia yang empatik. Format JSON.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        riskLevel: { type: Type.STRING },
        riskScore: { type: Type.NUMBER },
        trendDirection: { type: Type.STRING },
        triggers: { type: Type.ARRAY, items: { type: Type.STRING } },
        warningSignals: { type: Type.ARRAY, items: { type: Type.STRING } },
        message: { type: Type.STRING },
        recoveryPlan: {
          type: Type.OBJECT,
          properties: {
            today: { type: Type.ARRAY, items: { type: Type.STRING } },
            thisWeek: { type: Type.ARRAY, items: { type: Type.STRING } },
            longTerm: { type: Type.STRING }
          },
          required: ["today", "thisWeek", "longTerm"]
        },
        shouldSeeHelp: { type: Type.BOOLEAN },
        estimatedRecoveryDays: { type: Type.NUMBER }
      },
      required: ["riskLevel", "riskScore", "message", "recoveryPlan"]
    };

    return callGemini(prompt, systemInstruction, responseSchema);
  },

  chatWithCoach: async (message: string, context: any) => {
    const systemInstruction = `Kamu adalah FlowState AI Life Coach — asisten wellness dan produktivitas yang sangat empatik, personal, dan actionable.
Konteks user: Energy=${context.energyScore || '?'}/10, Task=${context.completedTasks || 0}/${context.totalTasks || 0}, Mood=${context.mood || '?'}, Nama=${context.userName || 'User'}.
Panduan: natural, hangat, max 150 kata, Bahasa Indonesia, berikan saran konkret.`;

    return callGemini(message, systemInstruction);
  },

  summarizeDocument: async (text: string, format: 'bullet' | 'narrative' | 'executive' | 'qa' = 'bullet') => {
    const formatGuides = {
      bullet: 'poin-poin singkat',
      narrative: 'paragraf mengalir',
      executive: 'summary formal',
      qa: 'tanya-jawab'
    };
    const prompt = `Ringkas dalam format ${formatGuides[format]}:
${text.substring(0, 8000)}`;

    const systemInstruction = `Ringkas dokumen yang diberikan sesuai format. 
Balas dalam Bahasa Indonesia. Format JSON.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        summary: { type: Type.STRING },
        keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
        actionItems: { type: Type.ARRAY, items: { type: Type.STRING } },
        originalWordCount: { type: Type.NUMBER },
        readingTimeSavedMinutes: { type: Type.NUMBER },
        documentType: { type: Type.STRING }
      },
      required: ["title", "summary", "keyPoints"]
    };

    return callGemini(prompt, systemInstruction, responseSchema);
  },

  draftEmail: async (context: string, tone: 'professional' | 'friendly' | 'assertive' | 'apologetic' = 'professional') => {
    const prompt = `Draft email untuk konteks: "${context}" dengan nada ${tone}.`;

    const systemInstruction = `Buat draft email yang sesuai dengan nada yang diminta.
Balas dalam Bahasa Indonesia. Format JSON.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        subject: { type: Type.STRING },
        greeting: { type: Type.STRING },
        body: { type: Type.STRING },
        closing: { type: Type.STRING },
        tone: { type: Type.STRING },
        wordCount: { type: Type.STRING }
      },
      required: ["subject", "greeting", "body", "closing"]
    };

    return callGemini(prompt, systemInstruction, responseSchema);
  },

  getDailyQuote: async (energyScore: number, mood: string) => {
    const prompt = `Energy: ${energyScore}/10, Mood: "${mood}".`;

    const systemInstruction = `Berikan quote motivasi yang tepat. 
Balas dalam Bahasa Indonesia. Format JSON.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        quote: { type: Type.STRING },
        author: { type: Type.STRING },
        context: { type: Type.STRING }
      },
      required: ["quote", "author", "context"]
    };

    return callGemini(prompt, systemInstruction, responseSchema);
  }
};
