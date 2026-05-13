export const getFirebaseError = (code: string) => {
  const messages: Record<string, string> = {
    'auth/wrong-password':                    'Kata sandi salah. Silakan coba lagi.',
    'auth/invalid-credential':                'Email atau kata sandi salah.',
    'auth/user-not-found':                    'Email ini belum terdaftar.',
    'auth/email-already-in-use':              'Email sudah digunakan akun lain.',
    'auth/weak-password':                     'Kata sandi terlalu lemah. Gunakan minimal 8 karakter.',
    'auth/invalid-email':                     'Format email tidak valid.',
    'auth/too-many-requests':                 'Terlalu banyak percobaan. Tunggu beberapa menit.',
    'auth/network-request-failed':            'Koneksi bermasalah. Periksa internetmu.',
    'auth/popup-closed-by-user':              'Login Google dibatalkan.',
    'auth/popup-blocked':                     'Pop-up diblokir. Izinkan pop-up untuk login Google.',
    'auth/account-exists-with-different-credential': 'Email terdaftar dengan metode login lain.',
    'auth/user-disabled':                     'Akun ini dinonaktifkan. Hubungi dukungan.',
    'auth/requires-recent-login':             'Sesi habis. Silakan masuk kembali.',
    'permission-denied':                      'Akses ditolak.',
    'unavailable':                            'Layanan tidak tersedia. Coba lagi nanti.',
    'not-found':                              'Data tidak ditemukan.',
  };
  return messages[code] || 'Terjadi kesalahan. Silakan coba lagi.';
};

export const getGeminiError = (err: any) => {
  const msg = err?.message || '';
  if (msg.includes('429')) return 'AI sedang sibuk. Tunggu beberapa detik dan coba lagi.';
  if (msg.includes('500')) return 'Server AI bermasalah. Coba lagi nanti.';
  if (msg.includes('network') || msg.includes('fetch')) return 'Koneksi bermasalah saat menghubungi AI.';
  return 'AI tidak dapat merespons saat ini. Coba lagi.';
};
