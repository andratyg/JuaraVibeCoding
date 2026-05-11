export const getFirebaseErrorMessage = (errorCode: string) => {
  const messages: Record<string, string> = {
    'auth/wrong-password':
      'Kata sandi salah. Silakan coba lagi.',
    'auth/invalid-credential':
      'Email atau kata sandi salah. Periksa kembali.',
    'auth/user-not-found':
      'Email ini belum terdaftar. Daftar akun baru?',
    'auth/email-already-in-use':
      'Email ini sudah digunakan. Coba masuk atau gunakan email lain.',
    'auth/weak-password':
      'Kata sandi terlalu lemah. Gunakan minimal 8 karakter.',
    'auth/invalid-email':
      'Format email tidak valid. Contoh: nama@email.com',
    'auth/too-many-requests':
      'Terlalu banyak percobaan. Tunggu beberapa menit.',
    'auth/network-request-failed':
      'Koneksi bermasalah. Periksa internet kamu.',
    'auth/popup-closed-by-user':
      'Login dengan Google dibatalkan.',
    'auth/popup-blocked':
      'Pop-up diblokir browser. Izinkan pop-up untuk login Google.',
    'auth/account-exists-with-different-credential':
      'Email ini terdaftar dengan metode login berbeda.',
    'auth/user-disabled':
      'Akun ini telah dinonaktifkan. Hubungi dukungan.',
    'auth/requires-recent-login':
      'Sesi habis. Silakan masuk kembali.',
    'permission-denied':
      'Akses ditolak. Kamu tidak punya izin untuk ini.',
    'unavailable':
      'Layanan tidak tersedia. Coba lagi nanti.',
    'not-found':
      'Data tidak ditemukan.',
    'default':
      'Terjadi kesalahan. Silakan coba lagi.'
  };
  return messages[errorCode] || messages['default'];
};

export const getGeminiErrorMessage = (error: any) => {
  if (error?.message?.includes('429'))
    return 'AI sedang sibuk. Tunggu beberapa detik dan coba lagi.';
  if (error?.message?.includes('500'))
    return 'Server AI bermasalah. Coba lagi nanti.';
  return 'AI tidak dapat merespons saat ini. Coba lagi.';
};
