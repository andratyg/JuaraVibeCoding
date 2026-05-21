import i18n from 'i18next'

// Format tanggal Indonesia
export const fDateLong  = (d: Date | string | number) => new Intl.DateTimeFormat(i18n.language === 'id' ? 'id-ID' : 'en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'}).format(new Date(d))
export const fDateShort = (d: Date | string | number) => new Intl.DateTimeFormat(i18n.language === 'id' ? 'id-ID' : 'en-US',{year:'numeric',month:'long',day:'numeric'}).format(new Date(d))
export const fTime      = (d: Date | string | number) => new Intl.DateTimeFormat(i18n.language === 'id' ? 'id-ID' : 'en-US',{hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(d))

// Format angka Indonesia
export const fNumber    = (n: number)  => new Intl.NumberFormat(i18n.language === 'id' ? 'id-ID' : 'en-US').format(n)
export const fKalori    = (n: number)  => `${fNumber(n)} ${i18n.language === 'id' ? 'kal' : 'cal'}`
export const fMenit     = (m: number)  => {
  if (i18n.language === 'id') {
    return m >= 60 ? `${Math.floor(m/60)} jam${m%60>0?' '+m%60+' menit':''}` : `${m} menit`
  }
  return m >= 60 ? `${Math.floor(m/60)} hr${m%60>0?' '+m%60+' min':''}` : `${m} min`
}

// Waktu relatif
export const fRelative = (date: Date | string | number) => {
  const rtf  = new Intl.RelativeTimeFormat(i18n.language, { numeric: 'auto' })
  const diff = (new Date(date).getTime() - Date.now()) / 1000
  if (Math.abs(diff) < 60)    return i18n.language === 'id' ? 'baru saja' : 'just now'
  if (Math.abs(diff) < 3600)  return rtf.format(Math.round(diff/60), 'minute')
  if (Math.abs(diff) < 86400) return rtf.format(Math.round(diff/3600), 'hour')
  return rtf.format(Math.round(diff/86400), 'day')
}

// Salam berdasarkan jam
export const getSalam = (name = '') => {
  const h = new Date().getHours()
  let key = 'morning'
  if (h >= 11 && h < 15) key = 'afternoon'
  else if (h >= 15 && h < 18) key = 'evening'
  else if (h >= 18 || h < 5) key = 'night'
  
  const s = i18n.t(`dashboard.greetings.${key}`)
  return name ? `${s}, ${name}!` : `${s}!`
}

// Keep old names for compatibility during migration if needed, but the prompt implies a total swap.
export const formatDateLong = fDateLong;
export const formatDateShort = fDateShort;
export const formatTime = fTime;
export const formatNumber = fNumber;
export const formatKalori = fKalori;
export const formatMenit = fMenit;
export const formatRelative = fRelative;
