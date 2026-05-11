// "Senin, 12 Mei 2026"
export const formatDateLong = (date: Date | string | number) =>
  new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date));

// "12 Mei 2026"
export const formatDateShort = (date: Date | string | number) =>
  new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date));

// "14:30" (24 jam)
export const formatTime = (date: Date | string | number) =>
  new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date(date));

// "1.240" (titik ribuan Indonesia)
export const formatNumber = (num: number) =>
  new Intl.NumberFormat('id-ID').format(num);

export const formatKalori = (cal: number) => `${formatNumber(cal)} kal`;

export const formatMenit = (min: number) =>
  min >= 60
    ? `${Math.floor(min / 60)} jam${min % 60 > 0 ? ' ' + (min % 60) + ' menit' : ''}`
    : `${min} menit`;

// "baru saja", "2 menit lalu", "kemarin"
export const formatRelative = (date: Date | string | number) => {
  const rtf = new Intl.RelativeTimeFormat('id', { numeric: 'auto' });
  const diffInMs = new Date(date).getTime() - Date.now();
  const diffInSecs = diffInMs / 1000;

  if (Math.abs(diffInSecs) < 60) return 'baru saja';
  if (Math.abs(diffInSecs) < 3600) return rtf.format(Math.round(diffInSecs / 60), 'minute');
  if (Math.abs(diffInSecs) < 86400) return rtf.format(Math.round(diffInSecs / 3600), 'hour');
  return rtf.format(Math.round(diffInSecs / 86400), 'day');
};

// Salam sesuai jam
export const getSalam = (name = '') => {
  const h = new Date().getHours();
  const s = h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 18 ? 'Selamat sore' : 'Selamat malam';
  return name ? `${s}, ${name}! 👋` : `${s}! 👋`;
};
