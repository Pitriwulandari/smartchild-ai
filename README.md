# DOKUMENTASI PROJECT SMARTCHILD AI

**Sistem Deteksi Dini Autisme Balita Berbasis Kecerdasan Buatan**

---

## 1. LATAR BELAKANG DAN TUJUAN PROJECT

### 1.1 Latar Belakang

Deteksi dini autisme pada balita, khususnya di tingkat fasilitas kesehatan primer seperti Posyandu, sering kali masih dilakukan secara manual menggunakan borang kertas atau bahkan hanya mengandalkan intuisi. Keterbatasan waktu, alat ukur yang tidak terintegrasi, serta kurangnya akses ke pakar medis di daerah membuat banyak kasus keterlambatan tumbuh kembang atau _Autism Spectrum Disorder_ (ASD) baru terdiagnosis saat anak memasuki usia sekolah. Penanganan yang terlambat ini sangat mengurangi efektivitas intervensi dan terapi tumbuh kembang pada periode emas anak (_golden age_).

### 1.2 Tujuan Project

SmartChild AI hadir sebagai platform digital terpadu berbasis kecerdasan buatan (AI) yang bertujuan untuk:

- Mempermudah Kader Posyandu dan Orang Tua dalam melakukan skrining awal autisme secara akurat, cepat, dan mandiri.
- Mengintegrasikan kuesioner standar medis Q-CHAT-10 dengan analisis respons fokus visual (_gaze tracking_) sederhana menggunakan kamera perangkat HP/laptop.
- Menghasilkan rekomendasi panduan stimulasi mandiri serta Surat Rujukan Otomatis untuk mempercepat proses intervensi di Fasilitas Kesehatan (Puskesmas/Rumah Sakit).

---

## 2. ARSITEKTUR DAN ALUR KERJA SISTEM (PIPELINE)

Proses pemrosesan data pada SmartChild AI dari awal hingga akhir mengikuti alur terstruktur (_pipeline_) sebagai berikut:

```
User Input
  ↓
AI Processing
  ↓
Langflow & DataStax
  ↓
Groq API
  ↓
IBM Bob
  ↓
Output
  ↓
User Action
```

### Rincian Tahapan Alur Kerja:

1. **User Input:**
   Orang tua atau Kader Posyandu memasukkan data awal balita (nama, usia), melengkapi 10 butir pertanyaan kuesioner Q-CHAT-10, serta mengizinkan akses kamera untuk menguji titik pandang/fokus visual anak.

2. **AI Processing:**
   Aplikasi mengekstraksi dan menghitung skor akumulasi kuesioner Q-CHAT-10 sekaligus memetakan pola koordinat titik pandang visual dari kamera.

3. **Langflow & DataStax:**
   Data JSON hasil skrining dikirim ke _workflow logic_ di Langflow yang ter-deploy secara _cloud_ dan stabil pada platform **DataStax**. Langflow mengarahkan alur _prompts_ dan aturan keputusan bisnis.

4. **Groq API:**
   Langflow memanfaatkan **Groq API** sebagai mesin _LLM Inference_ berkecepatan tinggi untuk mengeksekusi penalaran (_reasoning_) diagnosis awal dan kategorisasi tingkat risiko secara realistis.

5. **IBM Bob:**
   Bertindak sebagai _assistant & development engine_ yang mengelola integrasi antarmuka, memanggil _endpoint API_ Langflow, serta mengolah struktur data respons untuk ditampilkan ke UI.

6. **Output:**
   Aplikasi menampilkan hasil penilaian tingkat risiko (Rendah, Sedang, atau Tinggi), panduan stimulasi edukatif (video/artikel), serta opsi pengunduhan Surat Rujukan Otomatis.

7. **User Action:**
   Orang tua menjalankan panduan edukasi mandiri di rumah (untuk risiko rendah) atau membawa Surat Rujukan ke Fasilitas Kesehatan/Rumah Sakit rujukan BPJS (untuk risiko sedang/tinggi).

---

## 3. INTEGRASI IBM LANGFLOW DAN IBM BOB

Kerja sama antara **IBM Langflow** dan **IBM Bob** merupakan kunci utama dari keandalan dan kecepatan aplikasi SmartChild AI.

### 3.1 Peran IBM Langflow

IBM Langflow bertindak sebagai **Mesin Pemroses Logika AI (_AI Logic Engine & Orchestrator_)**. Langflow bertugas:

- Mengelola _workflow_ alur logika medis dan _prompt engineering_.
- Menghubungkan variabel input dengan **Groq API** untuk penalaran model LLM secara _real-time_.
- Mengelompokkan hasil analisis menjadi kategori risiko yang presisi serta mendrafkan kalimat rekomendasi intervensi.

### 3.2 Peran IBM Bob

IBM Bob bertindak sebagai **Agen Antarmuka & Asisten Pengembang (_Development & UI Interaction Agent_)**. Bob bertugas:

- Membantu menyusun dan merapikan struktur kode aplikasi (HTML, CSS, JavaScript) untuk pengguna multi-peran (Kader, Orang Tua, dan Admin).
- Menghubungkan komponen _frontend_ aplikasi ke _endpoint API_ Langflow.
- Mengolah paket _payload_ JSON dari pengguna dan merender kembali hasil dari Langflow menjadi visual UI yang user-friendly dan ramah pengoperasiannya.

### 3.3 Mekanisme Perpindahan Data

1. **Pengiriman Data:** Pengguna mengisi data di UI yang dikelola IBM Bob. Bob mengemas data tersebut ke dalam format _payload JSON_.
2. **Pemrosesan Backend:** IBM Bob mengirimkan paket JSON melalui pemanggilan API ke IBM Langflow (yang berjalan di DataStax).
3. **Eksekusi AI:** Langflow meneruskan data ke **Groq API** untuk inferensi kilat dan menyusun draf keputusan medis.
4. **Pengembalian Hasil:** Langflow mengembalikan paket JSON balasan berisi status risiko, rekomendasi edukasi, dan draf rujukan ke IBM Bob untuk langsung dirender ke layar pengguna.

### 3.4 Output Akhir Integrasi

Output akhir berupa aplikasi skrining autisme _end-to-end_ yang responsif, di mana pengembang dapat dengan mudah memelihara alur AI (lewat Langflow) dan antarmuka pengguna (lewat Bob) secara terpisah tanpa saling mengganggu fungsionalitas utama.

---

## 4. CARA MENGAKSES DAN MENGUJI PROJECT

### 4.1 Tautan Repository dan Berkas

- **Link Repository GitHub / Google Drive:** `[https://github.com/Pitriwulandari/smartchild-ai]`
- **Status Akses:** Publik

### 4.2 Petunjuk Pengujian Aplikasi oleh Reviewer:

1. **Membuka Aplikasi:** Buka tautan aplikasi yang disediakan di browser desktop maupun perangkat seluler.
2. **Pengisian Skrining:**
   - Pilih peran (misal: Kader / Orang Tua).
   - Masukkan data identitas balita (Nama, Usia dalam bulan).
   - Jawab 10 pertanyaan kuesioner Q-CHAT-10 sesuai kondisi perilaku balita.
   - Izinkan kamera untuk pengujian fokus mata singkat.
3. **Melihat Hasil:** Tekan tombol **Proses Skrining**.
4. **Evaluasi Output:**
   - Amati hasil kategori risiko yang muncul (**Rendah / Sedang / Tinggi**).
   - Buka panduan materi stimulasi edukatif yang disarankan.
   - Coba fitur **Unduh Surat Rujukan Otomatis** jika hasil skrining menunjukkan kategori risiko Sedang atau Tinggi.

   bisa klik link ini buat akses
   https://smartchild-ai.vercel.app/

   bisa menggunakan akun ini untuk login

   username:kader
   pasword :posyandu123

   username:ortu
   pasword :ortu123

   username:admin
   pasword :admin123
