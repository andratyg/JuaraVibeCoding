# ⚡ FlowState — Work Smarter. Feel Better. Every Single Day.

> **AI Wellness-Productivity Coach** yang menyesuaikan jadwal kerja, program fitness, dan wellness harianmu berdasarkan kondisi energi real-time.

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-FlowState-6C63FF?style=for-the-badge)](https://ais-pre-bbkbbh5fdjkqplz5m25eyq-363444032477.asia-southeast1.run.app)
[![JuaraVibeCoding](https://img.shields.io/badge/🏆_JuaraVibeCoding-2026-1DB97A?style=for-the-badge)](https://goo.gle/juaravibecoding)

## Masalah yang Diselesaikan
Pekerja muda Indonesia menggunakan banyak productivity tools (Notion, Todoist, Google Calendar) namun **tetap burnout** — karena tools tersebut tidak peduli kondisi energi dan mental penggunanya. FlowState hadir dengan pendekatan berbeda: jadwal kerja yang **adaptif dan berbasis data wellness**.

## Fitur Utama
| Fitur | Deskripsi |
|---|---|
| 🌅 Morning Energy Check-in | 3 slider → Gemini analisis → dapat mode kerja optimal + jadwal personal |
| 📋 Adaptive Task Scheduler | AI susun jadwal berdasarkan energy score, deadline, dan preferensi |
| 🏃 Personal Fitness Coach | Program latihan yang menyesuaikan hari sibuk dan kondisi energimu |
| ⚠️ Burnout Early Warning | Deteksi risiko burnout 3-5 hari lebih awal dengan recovery plan dari Gemini |
| 🧠 AI Life Coach Chat | Asisten yang tahu seluruh konteksmu — task, energi, mood, fitness |
| 📖 Reflection Journal | AI respond dengan empati + insight mendalam dari pola jurnalmu |
| 📊 Weekly Analytics | Visualisasi pattern produktivitas, wellness, dan fitness dalam satu dashboard |
| 📄 Document Summarizer | Upload PDF/paste teks → ringkasan + action items dalam 10 detik |

## Tech Stack
| Layer | Teknologi |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS + Framer Motion |
| AI Engine | Gemini 2.0 Flash API |
| Auth | Firebase Authentication (Google + Email) |
| Database | Firestore (real-time) |
| Charts | Recharts |
| Deploy | Google Cloud Run |

## Cara Jalankan Lokal
1. Clone repo: `git clone https://github.com/andratyg/JuaraVibeCoding.git`
2. Masuk folder: `cd JuaraVibeCoding`
3. Install dependencies: `npm install`
4. Buat .env: `cp .env.example .env` — isi nilai dari Firebase & Gemini console
5. Jalankan: `npm run dev`
6. Buka: `http://localhost:3000`

## Environment Variables
Lihat `.env.example` untuk daftar lengkap. Variabel utama:
- `VITE_GEMINI_API_KEY` — dari Google AI Studio
- `VITE_FIREBASE_*` — dari Firebase Console → Project Settings

---
*Dibuat untuk #JuaraVibeCoding 2026 — Google Developer Student Clubs Indonesia* 🇮🇩
