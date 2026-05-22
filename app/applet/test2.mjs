import fetch from "node-fetch";

async function test() {
  try {
    console.log("Testing generateWeeklyInsight...");
    const res = await fetch("http://localhost:3000/api/gemini/generateWeeklyInsight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ args: [[{day: "Senin", score: 0, tasks: 0}, {day: "Selasa", score: 0, tasks: 0}]] })
    });
    console.log(await res.text());
  } catch(e) {
    console.error(e);
  }
}
test();
