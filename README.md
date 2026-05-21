# Velora — AI Wellness & Productivity Assistant

> Solusi AI terpadu yang menggabungkan Wellness Coach dan Productivity Assistant khusus untuk remote worker di Indonesia.

## 📖 Deskripsi Singkat
**Velora** adalah sebuah platform berbasis web yang dirancang secara spesifik untuk memantau, mendampingi, dan meningkatkan produktivitas serta kesejahteraan mental para pekerja *remote* di Indonesia. Dengan memanfaatkan teknologi AI canggih (secara spesifik didukung Google Gemini), Velora mampu beradaptasi dengan tingkat energi harian penggunanya, memberikan rekomendasi tugas, jurnal refleksi, serta rutinitas kesehatan yang dipersonalisasi.

## 🤔 Latar Belakang

### Masalah
Di era kerja jarak jauh (*remote working*), banyak pekerja yang kesulitan memisahkan antara batas kehidupan pribadi dan profesional. Tekanan pekerjaan yang berlebihan tanpa adanya peringatan dini terkait kelelahan dapat memicu *burnout*. Tidak ada sistem pendamping yang cukup adaptif dalam secara langsung mempertimbangkan kesejahteraan (*wellness*) maupun ritme sirkadian (tingkat energi) sebelum memaksakan sebuah target produktivitas.

### Solusi
**Velora** hadir untuk mendefinisikan ulang makna produktivitas. Berbeda dengan aplikasi manajemen tugas eksekutif tradisional yang hanya berfokus pada metrik tenggat waktu pengerjaan, Velora secara cerdas menyesuaikan rekomendasi pekerjaannya dengan tingkat energi penggunanya secara *real-time*. Sistem ini bukan sekadar asisten penjadwalan, melainkan seorang *Wellness Coach* yang memberdayakan individu untuk tetap tangguh, seimbang, dan menyelesaikan ragam *goals* tanpa mengorbankan kesehatan mental diri mereka.

## ✨ Fitur Utama
- **Energy Calibration Check:** Layar parameter biometrik konseptual berbasis input pengguna untuk memantau level energi dan potensi stres.
- **Smart Adaptive Dashboard:** Dashboard preskriptif yang merespons secara dinamis terhadap kondisi emosional dan tingkat energi pengguna.
- **AI Coach Pintar:** Antarmuka percakapan AI (*Chat implementation*) untuk memberikan saran produktivitas, mengurai beban kognitif, dan menjaga keseimbangan mental harian.
- **Task Manager & Summarizer:** Manajemen pendelegasian tugas (*Task*) cerdas yang dilengkapi fitur peringkasan serta ekstraksi informasi *long-form.*
- **Journal & Refleksi Harian:** Dokumentasi refleksi suasana hati (*mood-tracker*) hari demi hari.
- **Fitness & Wellness Recommendation:** Rekomendasi aktivitas fisik yang disesuaikan dengan kondisi energi, terstruktur mulai dari peregangan ringan hingga olahraga HIIT ringan.

## 💻 Teknologi yang Digunakan (Tech Stack)

### Frontend
- **React 19**
- **Vite**
- **Tailwind CSS v4** & **Framer Motion** untuk *adaptive UI design* dan animasi
- **Lucide React** (Icons)
- **Recharts** (Visualisasi basis data metrik energi dan penyelesaian tugas)
- **React Helmet Async** (SEO Management)
- **React Router DOM**

### Backend & Integrasi Ekosistem
- **Node.js** & **Express** Server
- **Google Generative AI SDK** sebagai inferensi inteligensia (*Agentic behavior*).
- **Firebase** (Firestore Database & Authentication Setup) 
- **ESBuild & TSX**

## ⚙️ Prasyarat Sistem
Sebelum Anda memulai operasional proyek secara lokal, pastikan lingkungan sistem (*env*) telah memiliki:
- Node.js (Versi kompilasi 20.x atau lebih baru disarankan)
- NPM atau Yarn (*Package manager*)
- Kredensial Firebase (*Project configuration keys*)
- Google Gemini API Key aktif dan tervalidasi.

## 🛠 Instruksi Instalasi

1. **Kloning Repositori**
   ```bash
   git clone https://github.com/username/velora.git
   cd velora
   ```

2. **Instalasi Dependensi Modul**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variables**
   Buat file `.env` pada repositori *root* sistem proyek Anda, dan atur variabel berikut merujuk dokumen *best practices*:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Menjalankan Development Server**
   ```bash
   npm run dev
   ```
   Web server pengembangan interaktif (*Hot Module Replacement disabled by default*) akan aktif, dan umumnya dirutekan melalui *localhost* port kustom.

## 🚀 Cara Penggunaan
1. **Pendaftaran / Autentikasi Sistem**: Akses gerbang masuk halaman utama dan lakukan proses log masuk (*Login/Register*) mengacu implementasi *Firebase Auth* bawaan.
2. **Energy Check-In Kalibrasi Harian**: Tiap kali log rotasi pagi dimulai, kerjakan "Energy Check-In" untuk mendesain kalibrasi jadwal otomatis.
3. **Penyelarasan Tugas (*Tasks Allocation*)**: Buka modul Task Manager untuk memoderasi tumpukan (*backlog*) rencana kerja, atau hubungi AI Coach secara proaktif jika beban dirasa melampaui limitasi harian.
4. **Peninjauan Ulang Logika Kesehatan (Journal)**: Rekam jejak preseden (*mood*) di menu *Journal*, berikan kuasa bagi sistem mengartikulasikan pandangan emosional Anda pada layar tampilan visual (*Analytics*). 

## 🤝 Kontribusi
Kami membangun solusi ini dengan asas kolaboratif *Open-source*. Jika Anda memiliki atensi untuk membentuk ekosistem ini menjadi entitas lebih bernilai:
1. Lakukan *Fork* repositori ini pada akun anda.
2. Buat sub-cabang (*branch*) representasi fitur Anda (`git checkout -b fitur/NamaFiturAtauPerbaikan`).
3. Lakukan *commit* dengan deskripsi transparan untuk tiap iterasi iterasi implementatif (`git commit -m 'Membuat skema visual Fitur X'`).
4. Unggah terusan perbaikan Anda ke *branch* eksternal (`git push origin fitur/NamaFiturAtauPerbaikan`).
5. Buka sesi eksaminasi teknis dengan **Pull Request** kepada kontributor pemelihara utama.

> *"Efisiensi yang sejati lahir dari pikiran yang tangguh dan keseimbangan yang terjaga."* — Velora Team
