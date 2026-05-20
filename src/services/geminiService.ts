const proxyMethod = (method: string) => async (...args: any[]) => {
  const res = await fetch(`/api/gemini/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ args })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    let errorMsg = (errorData && errorData.error) ? errorData.error : `Server Error: ${res.statusText}`;
    if (typeof errorMsg === 'string' && errorMsg.startsWith('{')) {
      try {
        const parsed = JSON.parse(errorMsg);
        if (parsed.error && parsed.error.message) errorMsg = parsed.error.message;
      } catch(e) {}
    }
    throw new Error(errorMsg);
  }
  const data = await res.json();
  return data.result;
};

export const geminiService = {
  analyzeEnergyCheckIn: proxyMethod('analyzeEnergyCheckIn'),
  scheduleTasks: proxyMethod('scheduleTasks'),
  generateFitnessProgram: proxyMethod('generateFitnessProgram'),
  generateNudge: proxyMethod('generateNudge'),
  generateJournalResponse: proxyMethod('generateJournalResponse'),
  generateWeeklyInsight: proxyMethod('generateWeeklyInsight'),
  checkBurnoutRisk: proxyMethod('checkBurnoutRisk'),
  chatWithCoach: proxyMethod('chatWithCoach'),
  summarizeDocument: proxyMethod('summarizeDocument'),
  draftEmail: proxyMethod('draftEmail'),
  getDailyQuote: proxyMethod('getDailyQuote')
};
