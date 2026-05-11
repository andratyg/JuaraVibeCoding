const API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || (process as any).env?.GEMINI_API_KEY;
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

const callGemini = async (prompt: string, systemInstruction = '', expectJson = true, retries = 2): Promise<any> => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const body: any = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
          ...(expectJson && { responseMimeType: 'application/json' })
        }
      };
      if (systemInstruction) {
        body.system_instruction = { parts: [{ text: systemInstruction }] };
      }
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || `HTTP Error ${res.status}`);
      }
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Empty response from Gemini');
      if (!expectJson) return text.trim();
      const cleaned = text.replace(/```json\n?|```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch (err: any) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
  }
};

export const geminiService = {
  analyzeEnergyCheckIn: async (energi: number, stres: number, fokus: number, mood: string) => {
    const prompt = `
Kamu adalah wellness AI coach. User melakukan morning check-in dengan data:
- Level energi fisik: ${energi}/10
- Level stres mental: ${stres}/10
- Tingkat fokus: ${fokus}/10
- Mood saat ini: "${mood}"

Analisis kondisi user dan berikan rekomendasi yang personal dan actionable.

PENTING: Balas SELALU dalam Bahasa Indonesia yang natural, hangat, dan empatik.
Balas HANYA dengan JSON valid berikut (tidak ada teks lain):
{
  "energyScore": <angka 1-10, rata-rata tertimbang dari ketiga input>,
  "mode": "<salah satu: Deep Work Mode | Balance Mode | Recovery Mode>",
  "modeReason": "<1 kalimat alasan singkat kenapa mode ini dipilih>",
  "narasi": "<2-3 kalimat personal, hangat, dan actionable dalam Bahasa Indonesia>",
  "topTip": "<1 tips spesifik dan konkret untuk hari ini>",
  "workSlots": ["<slot waktu produktif, misal: 08:00-10:30>", "<slot kedua>"],
  "avoidSlots": ["<waktu yang sebaiknya dihindari untuk kerja berat>"],
  "colorTheme": "<salah satu: teal | purple | amber>",
  "emoji": "<1 emoji yang merepresentasikan kondisi hari ini>"
}`;
    return callGemini(prompt);
  },

  scheduleTasks: async (tasks: any[], energyScore: number, workSlots: string[] | string) => {
    const taskList = tasks.map((t, i) =>
      `${i + 1}. "${t.title || t.name}" — ${t.duration} menit, prioritas: ${t.priority}, kategori: ${t.category || 'general'}`
    ).join('\n');
    const slotsString = Array.isArray(workSlots) ? workSlots.join(', ') : workSlots;
    const prompt = `
Energy Score user hari ini: ${energyScore}/10
Slot kerja tersedia: ${slotsString}

Daftar task yang perlu dijadwalkan:
${taskList}

Susun jadwal yang optimal. Task berat/kreatif di slot energi puncak, task admin di slot energi rendah.

PENTING: Balas SELALU dalam Bahasa Indonesia yang natural dan tidak kaku.
Balas HANYA JSON valid:
{
  "schedule": [
    {
      "taskId": "<index task, mulai dari 0>",
      "taskName": "<nama task>",
      "startTime": "<HH:MM>",
      "endTime": "<HH:MM>",
      "reason": "<alasan singkat penempatan waktu ini dalam Bahasa Indonesia>"
    }
  ],
  "totalMinutes": <total menit semua task>,
  "overloadWarning": <null atau "string peringatan jika total > kapasitas dalam Bahasa Indonesia">,
  "suggestedBreaks": ["<waktu istirahat yang disarankan, misal: 10:30-10:45>"]
}`;
    return callGemini(prompt);
  },

  generateFitnessProgram: async (profile: any, energyScore: number) => {
    const prompt = `
Data profil pengguna:
- Tinggi: ${profile.height} cm, Berat: ${profile.weight} kg
- Tujuan fitness: ${profile.goal}
- Level kebugaran: ${profile.level}
- Equipment tersedia: ${(profile.equipment || ['Bodyweight']).join(', ')}
- Energy Score hari ini: ${energyScore}/10

Buat program latihan yang realistis dan sesuai kondisi energi hari ini.
Jika energy rendah (1-3): program ringan 15-20 menit.
Jika energy sedang (4-6): program sedang 30-40 menit.
Jika energy tinggi (7-10): program penuh 45-60 menit.

PENTING: Balas SELALU dalam Bahasa Indonesia yang natural dan actionable.
Balas HANYA JSON valid:
{
  "totalDuration": <menit>,
  "intensity": "<ringan | sedang | tinggi>",
  "estimatedCalories": <kalori>,
  "warmup": {
    "duration": <menit>,
    "description": "<instruksi warmup dalam Bahasa Indonesia>"
  },
  "exercises": [
    {
      "name": "<nama exercise dalam Bahasa Indonesia>",
      "sets": <jumlah set>,
      "reps": "<jumlah rep atau durasi, misal: 12 atau 30 detik>",
      "restSeconds": <detik istirahat>,
      "muscleGroup": "<otot yang dilatih dalam Bahasa Indonesia>",
      "formTip": "<1 tips teknik yang penting dalam Bahasa Indonesia>",
      "modification": "<modifikasi jika terlalu berat dalam Bahasa Indonesia>"
    }
  ],
  "cooldown": {
    "duration": <menit>,
    "description": "<instruksi cooldown dalam Bahasa Indonesia>"
  },
  "motivationalMessage": "<pesan semangat personal berdasarkan kondisi hari ini dalam Bahasa Indonesia>"
}`;
    return callGemini(prompt);
  },

  generateNudge: async (energyScore: number, stressLevel: number, timeOfDay: string) => {
    const prompt = `
User butuh micro-break setelah 90 menit kerja fokus.
Energy Score: ${energyScore}/10
Stres: ${stressLevel}/10
Waktu sekarang: ${timeOfDay}

Berikan aktivitas micro-break 2-3 menit yang tepat untuk kondisi ini.

PENTING: Balas SELALU dalam Bahasa Indonesia yang natural.
Balas HANYA JSON valid:
{
  "activity": "<nama aktivitas dalam Bahasa Indonesia>",
  "type": "<breathing | stretching | movement | mindfulness | hydration>",
  "durationMinutes": <menit>,
  "steps": ["<langkah 1 dalam Bahasa Indonesia>", "<langkah 2>", "<langkah 3>"],
  "benefit": "<manfaat singkat kenapa aktivitas ini cocok sekarang dalam Bahasa Indonesia>",
  "emoji": "<emoji aktivitas>"
}`;
    return callGemini(prompt);
  },

  generateJournalResponse: async (entry: any) => {
    const prompt = `
User menuliskan jurnal harian mereka:
- Rating hari ini: ${entry.rating}/5 bintang
- Highlight terbaik: "${entry.highlight}"
- Tantangan terbesar: "${entry.challenge}"
- Catatan bebas: "${entry.freeWrite || '(tidak ada)'}"

Berikan respons sebagai wellness coach yang empatik dan bijak.

PENTING: Balas SELALU dalam Bahasa Indonesia yang natural, hangat, dan empatik.
Balas HANYA JSON valid:
{
  "response": "<2-3 kalimat respons hangat, empatik, dan apresiatif dalam Bahasa Indonesia>",
  "emotionTags": ["<emosi 1>", "<emosi 2>", "<emosi 3>"],
  "primaryMood": "<happy | grateful | tired | stressed | anxious | calm | excited | sad>",
  "reflectionQuestion": "<1 pertanyaan mendalam untuk direnungkan besok dalam Bahasa Indonesia>",
  "affirmation": "<1 kalimat afirmasi positif yang relevan dalam Bahasa Indonesia>",
  "insight": "<1 insight singkat tentang pola yang terlihat dari catatan ini dalam Bahasa Indonesia>"
}`;
    return callGemini(prompt);
  },

  generateWeeklyInsight: async (weeklyData: any[]) => {
    const summary = weeklyData.map(d =>
      `${d.date}: Energy=${d.energyScore}, Tasks=${d.completedTasks}/${d.totalTasks}, Mood=${d.mood}`
    ).join('\n');
    const prompt = `
Data aktivitas user selama 7 hari terakhir:
${summary}

Analisis pola dan berikan insight yang actionable.

PENTING: Balas SELALU dalam Bahasa Indonesia yang natural dan informatif.
Balas HANYA JSON valid:
{
  "summary": "<ringkasan 2-3 kalimat tentang performa minggu ini dalam Bahasa Indonesia>",
  "bestDay": "<hari terbaik dan alasannya dalam Bahasa Indonesia>",
  "worstDay": "<hari tersulit dan analisis singkatnya dalam Bahasa Indonesia>",
  "productivityPattern": "<pola produktivitas yang terdeteksi dalam Bahasa Indonesia>",
  "wellnessPattern": "<pola wellness yang terdeteksi dalam Bahasa Indonesia>",
  "topAchievement": "<pencapaian terbesar minggu ini dalam Bahasa Indonesia>",
  "recommendation": "<1 rekomendasi spesifik dan actionable untuk minggu depan dalam Bahasa Indonesia>",
  "productivityScore": <angka 1-100>,
  "wellnessScore": <angka 1-100>,
  "nextWeekFocus": "<fokus utama yang disarankan untuk minggu depan dalam Bahasa Indonesia>"
}`;
    return callGemini(prompt);
  },

  checkBurnoutRisk: async (recentCheckins: any[]) => {
    const data = recentCheckins.map(c =>
      `${c.date}: energi=${c.energi || c.energyScore}, stres=${c.stres}, fokus=${c.fokus}, mood="${c.mood}"`
    ).join('\n');
    const prompt = `
Data check-in user selama ${recentCheckins.length} hari terakhir:
${data}

Analisis risiko burnout secara mendalam berdasarkan tren data ini.

PENTING: Balas SELALU dalam Bahasa Indonesia yang natural dan empatik.
Balas HANYA JSON valid:
{
  "riskLevel": "<low | medium | high | critical>",
  "riskScore": <angka 0-100>,
  "trendDirection": "<improving | stable | declining | rapidly_declining>",
  "triggers": ["<faktor risiko 1 dalam Bahasa Indonesia>", "<faktor risiko 2>"],
  "warningSignals": ["<tanda peringatan yang terdeteksi dalam Bahasa Indonesia>"],
  "message": "<pesan empatik dan langsung kepada user, 2-3 kalimat dalam Bahasa Indonesia>",
  "recoveryPlan": {
    "today": ["<aksi darurat hari ini 1 dalam Bahasa Indonesia>", "<aksi darurat hari ini 2>"],
    "thisWeek": ["<langkah pemulihan minggu ini 1 dalam Bahasa Indonesia>", "<langkah 2>"],
    "longTerm": "<strategi jangka panjang dalam Bahasa Indonesia>"
  },
  "shouldSeeHelp": <true jika riskLevel critical atau high dengan declining trend>,
  "estimatedRecoveryDays": <estimasi hari untuk pulih>
}`;
    return callGemini(prompt);
  },

  chatWithCoach: async (message: string, context: any) => {
    const systemInstruction = `Kamu adalah FlowState AI Life Coach — asisten wellness dan produktivitas yang sangat empatik, personal, dan actionable.

Konteks user saat ini:
- Energy Score hari ini: ${context.energyScore || 'belum check-in'}/10
- Task hari ini: ${context.completedTasks || 0}/${context.totalTasks || 0} selesai
- Mood: ${context.mood || 'tidak diketahui'}
- Streak check-in: ${context.streak || 0} hari berturut-turut
- Nama: ${context.userName || 'User'}

Panduan respons:
1. Selalu gunakan nama user jika tersedia
2. Respons dalam Bahasa Indonesia yang natural, hangat, dan tidak kaku
3. Berikan saran konkret dan actionable, bukan hanya motivasi kosong
4. Maksimal 150 kata per respons
5. Jika user tampak stres atau overwhelmed, prioritaskan validasi perasaan dulu
6. Selalu akhiri dengan 1 pertanyaan atau aksi yang mendorong user melangkah`;

    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: [{ parts: [{ text: message }] }],
        generationConfig: { temperature: 0.85, maxOutputTokens: 512 }
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.candidates[0].content.parts[0].text.trim();
  },

  summarizeDocument: async (text: string, format: 'bullet' | 'narrative' | 'executive' | 'qa' = 'bullet') => {
    const formatGuides = {
      bullet: 'poin-poin singkat menggunakan bullet points',
      narrative: 'narasi paragraf yang mengalir dan mudah dibaca',
      executive: 'executive summary formal untuk keputusan bisnis',
      qa: 'format tanya-jawab Q&A yang informatif'
    };
    const prompt = `
Ringkas dokumen berikut dalam format: ${formatGuides[format]}

DOKUMEN:
${text.substring(0, 8000)}

PENTING: Balas SELALU dalam Bahasa Indonesia yang natural.
Balas HANYA JSON valid:
{
  "title": "<judul yang diidentifikasi atau disimpulkan dalam Bahasa Indonesia>",
  "summary": "<ringkasan utama sesuai format yang diminta dalam Bahasa Indonesia>",
  "keyPoints": ["<poin penting 1 dalam Bahasa Indonesia>", "<poin penting 2>", "<poin penting 3>", "<poin 4 jika ada>", "<poin 5 jika ada>"],
  "actionItems": ["<tindakan yang perlu diambil 1 dalam Bahasa Indonesia>", "<tindakan 2 jika ada>"],
  "originalWordCount": ${text.split(' ').length},
  "readingTimeSavedMinutes": ${Math.max(1, Math.round(text.split(' ').length / 200) - 1)},
  "documentType": "<jenis dokumen: laporan | artikel | email | kontrak | lainnya>"
}`;
    return callGemini(prompt);
  },

  draftEmail: async (context: string, tone: 'professional' | 'friendly' | 'assertive' | 'apologetic' = 'professional') => {
    const toneGuides = {
      professional: 'formal dan profesional',
      friendly: 'ramah dan santai namun tetap sopan',
      assertive: 'tegas dan langsung ke poin',
      apologetic: 'meminta maaf dengan tulus'
    };
    const prompt = `
Buat email dengan nada ${toneGuides[tone]} untuk konteks berikut:
"${context}"

PENTING: Balas SELALU dalam Bahasa Indonesia yang natural.
Balas HANYA JSON valid:
{
  "subject": "<subject email yang menarik dan relevan dalam Bahasa Indonesia>",
  "greeting": "<kalimat pembuka dalam Bahasa Indonesia>",
  "body": "<isi email lengkap dalam Bahasa Indonesia>",
  "closing": "<kalimat penutup dalam Bahasa Indonesia>",
  "tone": "${tone}",
  "wordCount": "<estimasi jumlah kata>"
}`;
    return callGemini(prompt);
  },

  getDailyQuote: async (energyScore: number, mood: string) => {
    const prompt = `
Berikan quote motivasi yang tepat untuk user dengan kondisi:
Energy Score: ${energyScore}/10, Mood: "${mood}"

PENTING: Balas SELALU dalam Bahasa Indonesia yang natural dan inspiratif.
Balas HANYA JSON valid:
{
  "quote": "<quote inspiratif dalam Bahasa Indonesia>",
  "author": "<nama tokoh atau Anonymous>",
  "context": "<1 kalimat kenapa quote ini relevan untuk kondisi user dalam Bahasa Indonesia>"
}`;
    return callGemini(prompt);
  }
};
