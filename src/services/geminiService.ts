import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

// In AI Studio, the API key is provided via process.env.GEMINI_API_KEY
const KEY = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey: KEY });
const DEFAULT_MODEL = 'gemini-3-flash-preview';

const ID  = '\n\nMANDATORY: Always respond in Indonesian (Bahasa Indonesia) ONLY. All text in JSON fields must be in natural, helpful Indonesian. NEVER respond in English.';

// FIX D2, D3: Core helper dengan retry + robust JSON parsing
const callGemini = async (prompt: string, systemInstruction = '', responseSchema?: any): Promise<any> => {
  const isJson = !!responseSchema;
  
  for (let i = 0; i < 3; i++) {
    try {
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
        console.error('JSON Parse Error:', parseErr, 'Raw text:', text);
        throw new Error(`Failed to parse AI response as JSON: ${parseErr.message}`);
      }
    } catch (err: any) {
      console.error(`Gemini API Attempt ${i+1} failed:`, err);
      if (i === 2) throw err;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i))); // exponential backoff
    }
  }
};

export const geminiService = {
  // 1. Morning Energy Check-in — FIX D4 (instruksi ID)
  analyzeEnergyCheckIn: async (energi: number, stres: number, fokus: number, mood: string) => {
    const prompt = `User morning check-in:
Energi fisik: ${energi}/10, Stres mental: ${stres}/10, Fokus: ${fokus}/10, Mood: "${mood}"

Analisis dan beri rekomendasi personal.`;

    const systemInstruction = `Kamu adalah FlowState AI Coach. Analisis kondisi user.
Balas JSON:
{
  "energyScore": <1-10 rata-rata tertimbang>,
  "mode": "<Deep Work Mode|Balance Mode|Recovery Mode>",
  "modeReason": "<1 kalimat alasan>",
  "narasi": "<2-3 kalimat personal, hangat, actionable>",
  "topTip": "<1 tips spesifik hari ini>",
  "workSlots": ["<HH:MM-HH:MM>","<HH:MM-HH:MM>"],
  "avoidSlots": ["<waktu hindari kerja berat>"],
  "colorTheme": "<teal|purple|amber>",
  "emoji": "<1 emoji kondisi>",
  "motivasiPagi": "<1 kalimat semangat>"
}${ID}`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        energyScore: { type: Type.NUMBER },
        mode: { type: Type.STRING },
        modeReason: { type: Type.STRING },
        narasi: { type: Type.STRING },
        topTip: { type: Type.STRING },
        workSlots: { type: Type.ARRAY, items: { type: Type.STRING } },
        avoidSlots: { type: Type.ARRAY, items: { type: Type.STRING } },
        colorTheme: { type: Type.STRING },
        emoji: { type: Type.STRING },
        motivasiPagi: { type: Type.STRING }
      },
      required: ["energyScore", "mode", "modeReason", "narasi", "topTip", "workSlots", "avoidSlots", "colorTheme", "emoji", "motivasiPagi"]
    };

    return callGemini(prompt, systemInstruction, responseSchema);
  },

  // 2. Task Scheduler
  scheduleTasks: async (tasks: any[], energyScore: number, workSlots: string[]) => {
    const taskList = tasks.map((t,i)=>`${i}. "${t.title || t.name}" (${t.duration}mnt, ${t.priority})`).join('; ');
    const prompt = `Energy: ${energyScore}/10. Slots: ${workSlots.join(', ')}.
Tasks: ${taskList}

Susun jadwal optimal. Task berat di puncak energi.`;

    const systemInstruction = `Jadwalkan task harian.
Balas JSON:
{
  "schedule": [{"taskId":"<index>","taskName":"","startTime":"HH:MM","endTime":"HH:MM","reason":""}],
  "overloadWarning": null,
  "suggestedBreaks": ["<HH:MM-HH:MM>"],
  "totalMinutes": <n>
}${ID}`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        schedule: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              taskId: { type: Type.STRING },
              taskName: { type: Type.STRING },
              startTime: { type: Type.STRING },
              endTime: { type: Type.STRING },
              reason: { type: Type.STRING }
            }
          }
        },
        overloadWarning: { type: Type.STRING, nullable: true },
        suggestedBreaks: { type: Type.ARRAY, items: { type: Type.STRING } },
        totalMinutes: { type: Type.NUMBER }
      },
      required: ["schedule", "suggestedBreaks", "totalMinutes"]
    };

    return callGemini(prompt, systemInstruction, responseSchema);
  },

  // 3. Fitness Program
  generateFitnessProgram: async (profile: any, energyScore: number) => {
    const prompt = `Profil: ${profile.height}cm/${profile.weight}kg, goal:${profile.goal}, level:${profile.level}, alat:${(profile.equipment||['Bodyweight']).join(',')}.
Energy: ${energyScore}/10. E<4=15mnt ringan, E4-6=30mnt sedang, E>6=45mnt penuh.`;

    const systemInstruction = `Buat program latihan fitness yang sesuai dengan profil dan level energi user hari ini.
Balas JSON:
{
  "totalDuration": <mnt>,
  "intensity": "<ringan|sedang|tinggi>",
  "estimatedCalories": <kal>,
  "warmup": {"duration":<mnt>,"description":""},
  "exercises": [{"name":"","sets":<n>,"reps":"","restSeconds":<n>,"muscleGroup":"","formTip":"","modification":""}],
  "cooldown": {"duration":<mnt>,"description":""},
  "motivationalMessage": "<pesan semangat>"
}${ID}`;

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
          }
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
            }
          }
        },
        cooldown: {
          type: Type.OBJECT,
          properties: {
            duration: { type: Type.NUMBER },
            description: { type: Type.STRING }
          }
        },
        motivationalMessage: { type: Type.STRING }
      },
      required: ["totalDuration", "intensity", "estimatedCalories", "warmup", "exercises", "cooldown", "motivationalMessage"]
    };

    return callGemini(prompt, systemInstruction, responseSchema);
  },

  // 4. Wellness Nudge
  generateNudge: async (energyScore: number, stressLevel: number, timeOfDay: string) => {
    const prompt = `Micro-break 90mnt. Energy:${energyScore}, Stres:${stressLevel}, Waktu:${timeOfDay}.`;
    const systemInstruction = `Beri aktivitas micro-break yang tepat.
Balas JSON: {"activity":"","type":"<breathing|stretching|movement|mindfulness>","durationMinutes":<n>,"steps":["","",""],"benefit":"","emoji":""}${ID}`;
    
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

  // 5. Journal Response
  generateJournalResponse: async (entry: any) => {
    const prompt = `Jurnal: rating=${entry.rating}/5, highlight="${entry.highlight}", tantangan="${entry.challenge}", catatan="${entry.freeWrite||'-'}".`;
    const systemInstruction = `Berikan respons sebagai coach yang empatik dan bijak terhadap jurnal user.
Balas JSON: {"response":"<2-3 kalimat empatik>","emotionTags":["","",""],"primaryMood":"<happy|grateful|tired|stressed|calm|excited|sad>","reflectionQuestion":"","affirmation":"","insight":""}${ID}`;
    
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
  },

  // 6. Weekly Insight
  generateWeeklyInsight: async (weeklyData: any[]) => {
    const dataString = weeklyData.map(d=>`${d.date}:E=${d.energyScore},T=${d.completedTasks||0}/${d.totalTasks||0}`).join(';');
    const prompt = `Data 7 hari: ${dataString}.`;
    const systemInstruction = `Beri insight performa mingguan user.
Balas JSON: {"summary":"","bestDay":"","worstDay":"","productivityPattern":"","recommendation":"","productivityScore":<1-100>,"wellnessScore":<1-100>,"nextWeekFocus":""}${ID}`;
    
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING },
        bestDay: { type: Type.STRING },
        worstDay: { type: Type.STRING },
        productivityPattern: { type: Type.STRING },
        recommendation: { type: Type.STRING },
        productivityScore: { type: Type.NUMBER },
        wellnessScore: { type: Type.NUMBER },
        nextWeekFocus: { type: Type.STRING }
      },
      required: ["summary", "bestDay", "worstDay", "productivityScore", "wellnessScore"]
    };

    return callGemini(prompt, systemInstruction, responseSchema);
  },

  // 7. Burnout Risk — FIX C3
  checkBurnoutRisk: async (checkins: any[]) => {
    const dataString = checkins.map(c=>`E=${c.energi||c.energyScore||5},S=${c.stres||5}`).join(';');
    const prompt = `Check-in ${checkins.length} hari: ${dataString}.
Analisis risiko burnout mendalam.`;

    const systemInstruction = `Analisis risiko burnout.
Balas JSON: {"riskLevel":"<low|medium|high|critical>","riskScore":<0-100>,"trendDirection":"<improving|stable|declining>","triggers":["",""],"warningSignals":["",""],"message":"<pesan empatik ke user>","recoveryPlan":{"today":["",""],"thisWeek":["",""],"longTerm":""},"shouldSeeHelp":<true|false>,"estimatedRecoveryDays":<n>}${ID}`;
    
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
          }
        },
        shouldSeeHelp: { type: Type.BOOLEAN },
        estimatedRecoveryDays: { type: Type.NUMBER }
      },
      required: ["riskLevel", "riskScore", "message", "recoveryPlan"]
    };

    return callGemini(prompt, systemInstruction, responseSchema);
  },

  // 8. AI Coach Chat — FIX D5 (context user dikirim)
  chatWithCoach: async (message: string, context: any) => {
    const system = `Kamu adalah FlowState AI Life Coach — empatik, personal, dan actionable.
Konteks user saat ini:
- Nama: ${context.userName || 'Kamu'}
- Energy Score hari ini: ${context.energyScore || 'belum check-in'}/10
- Task: ${context.completedTasks || 0}/${context.totalTasks || 0} selesai
- Mood: ${context.mood || 'tidak diketahui'}
- Streak: ${context.streak || 0} hari berturut

Panduan respons WAJIB:
1. Gunakan nama user jika tersedia
2. SELALU jawab dalam Bahasa Indonesia yang hangat dan tidak kaku
3. Berikan saran konkret dan actionable — bukan hanya motivasi kosong
4. Maksimal 150 kata per respons
5. Jika user stres/overwhelmed, validasi perasaannya dulu sebelum saran
6. Akhiri dengan 1 pertanyaan atau aksi konkret yang mendorong user melangkah
7. JANGAN pernah menjawab dalam Bahasa Inggris`;

    return callGemini(message, system, false);
  },

  // 9. Document Summarizer
  summarizeDocument: async (text: string, format: 'bullet' | 'narrative' | 'executive' | 'qa' = 'bullet') => {
    const fmtMap = {bullet:'poin-poin singkat',narrative:'narasi paragraf mengalir',executive:'executive summary formal',qa:'format tanya-jawab Q&A'}
    const prompt = `Ringkas dokumen: ${text.substring(0, 8000)}`;
    const systemInstruction = `Ringkas dokumen berikut dalam format: ${fmtMap[format] || format}.
Balas JSON: {"title":"","summary":"","keyPoints":["","","","",""],"actionItems":["",""],"originalWordCount":${text.split(' ').length},"readingTimeSavedMinutes":${Math.max(1,Math.round(text.split(' ').length/200)-1)},"documentType":"<laporan|artikel|email|kontrak|lainnya>"}${ID}`;
    
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

  // 10. Email Drafter
  draftEmail: async (context: string, tone: 'professional' | 'friendly' | 'assertive' | 'apologetic' = 'professional') => {
    const tonesMap = {professional:'formal profesional',friendly:'ramah santai sopan',assertive:'tegas langsung poin',apologetic:'meminta maaf tulus'}
    const prompt = `Email draft untuk: "${context}".`;
    const systemInstruction = `Buat email dengan nada ${tonesMap[tone] || tone}.
Balas JSON: {"subject":"","greeting":"","body":"","closing":"","tone":"${tone}"}${ID}`;
    
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        subject: { type: Type.STRING },
        greeting: { type: Type.STRING },
        body: { type: Type.STRING },
        closing: { type: Type.STRING },
        tone: { type: Type.STRING }
      },
      required: ["subject", "greeting", "body", "closing"]
    };

    return callGemini(prompt, systemInstruction, responseSchema);
  },

  // 11. Daily Quote
  getDailyQuote: async (energyScore: number, mood: string) => {
    const prompt = `Energy:${energyScore}/10, Mood:"${mood}".`;
    const systemInstruction = `Beri quote motivasi harian.
Balas JSON: {"quote":"<dalam Bahasa Indonesia>","author":"","context":""}${ID}`;
    
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
