// Format tanggal panjang: "Senin, 12 Mei 2026"
export const formatDateLong = (date: Date | string | number) =>
  new Intl.DateTimeFormat('id-ID', {
    weekday: 'long', year: 'numeric',
    month: 'long', day: 'numeric'
  }).format(new Date(date))

// Format tanggal pendek: "12 Mei 2026"
export const formatDateShort = (date: Date | string | number) =>
  new Intl.DateTimeFormat('id-ID', {
    year: 'numeric', month: 'long', day: 'numeric'
  }).format(new Date(date))

// Format tanggal ringkas: "12/05/2026"
export const formatDateNumeric = (date: Date | string | number) =>
  new Intl.DateTimeFormat('id-ID', {
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date(date))

// Format waktu 24 jam: "14:30"
export const formatTime = (date: Date | string | number) =>
  new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit', minute: '2-digit', hour12: false
  }).format(new Date(date))

// Format angka dengan pemisah ribuan: "1.240"
export const formatNumber = (num: number) =>
  new Intl.NumberFormat('id-ID').format(num)

// Satuan spesifik
export const formatKalori = (cal: number) => `${formatNumber(cal)} kal`
export const formatLangkah = (steps: number) => `${formatNumber(steps)} langkah`
export const formatMenit = (min: number) => min >= 60
  ? `${Math.floor(min/60)} jam ${min%60 > 0 ? (min%60) + ' menit' : ''}`
  : `${min} menit`

// Waktu relatif: "2 menit lalu", "kemarin", "baru saja"
export const formatRelative = (date: Date | string | number) => {
  const rtf = new Intl.RelativeTimeFormat('id', { numeric: 'auto' })
  const diffSec = (new Date(date).getTime() - Date.now()) / 1000
  if (Math.abs(diffSec) < 60) return 'baru saja'
  if (Math.abs(diffSec) < 3600) return rtf.format(Math.round(diffSec/60), 'minute')
  if (Math.abs(diffSec) < 86400) return rtf.format(Math.round(diffSec/3600), 'hour')
  return rtf.format(Math.round(diffSec/86400), 'day')
}

// Salam berdasarkan jam
export const getSalam = (name = '') => {
  const hour = new Date().getHours()
  const salam = hour < 11 ? 'Selamat pagi'
    : hour < 15 ? 'Selamat siang'
    : hour < 18 ? 'Selamat sore'
    : 'Selamat malam'
  return name ? `${salam}, ${name}! 👋` : `${salam}! 👋`
}
