// Format tanggal Indonesia
export const fDateLong  = (d: Date | string | number) => new Intl.DateTimeFormat('id-ID',{weekday:'long',year:'numeric',month:'long',day:'numeric'}).format(new Date(d))
export const fDateShort = (d: Date | string | number) => new Intl.DateTimeFormat('id-ID',{year:'numeric',month:'long',day:'numeric'}).format(new Date(d))
export const fTime      = (d: Date | string | number) => new Intl.DateTimeFormat('id-ID',{hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(d))

// Format angka Indonesia
export const fNumber    = (n: number)  => new Intl.NumberFormat('id-ID').format(n)
export const fKalori    = (n: number)  => `${fNumber(n)} kal`
export const fMenit     = (m: number)  => m >= 60 ? `${Math.floor(m/60)} jam${m%60>0?' '+m%60+' menit':''}` : `${m} menit`

// Waktu relatif
export const fRelative = (date: Date | string | number) => {
  const rtf  = new Intl.RelativeTimeFormat('id', { numeric: 'auto' })
  const diff = (new Date(date).getTime() - Date.now()) / 1000
  if (Math.abs(diff) < 60)    return 'baru saja'
  if (Math.abs(diff) < 3600)  return rtf.format(Math.round(diff/60), 'minute')
  if (Math.abs(diff) < 86400) return rtf.format(Math.round(diff/3600), 'hour')
  return rtf.format(Math.round(diff/86400), 'day')
}

// Salam berdasarkan jam
export const getSalam = (name = '') => {
  const h = new Date().getHours()
  const s = h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 18 ? 'Selamat sore' : 'Selamat malam'
  return name ? `${s}, ${name}! 👋` : `${s}! 👋`
}

// Keep old names for compatibility during migration if needed, but the prompt implies a total swap.
export const formatDateLong = fDateLong;
export const formatDateShort = fDateShort;
export const formatTime = fTime;
export const formatNumber = fNumber;
export const formatKalori = fKalori;
export const formatMenit = fMenit;
export const formatRelative = fRelative;
