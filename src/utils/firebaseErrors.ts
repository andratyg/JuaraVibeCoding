export const getFirebaseErrorMessage = (errorCode: string) => {
  const messages: Record<string, string> = {
    // Auth errors
    'auth/wrong-password':
      'Kata sandi salah. Silakan coba lagi.',
    'auth/invalid-credential':
      'Email atau kata sandi salah. Periksa kembali.',
    'auth/user-not-found':
      'Email ini belum terdaftar. Periksa kembali atau daftar akun baru.',
    'auth/email-already-in-use':
      'Email ini sudah digunakan akun lain. Coba masuk atau gunakan email lain.',
    'auth/weak-password':
      'Kata sandi terlalu lemah. Gunakan minimal 8 karakter dengan angka.',
    'auth/invalid-email':
      'Format email tidak valid. Contoh yang benar: nama@email.com',
    'auth/too-many-requests':
      'Terlalu banyak percobaan masuk. Tunggu beberapa menit sebelum coba lagi.',
    'auth/network-request-failed':
      'Koneksi internet bermasalah. Periksa koneksimu dan coba lagi.',
    'auth/popup-closed-by-user':
      'Login dengan Google dibatalkan. Silakan coba lagi.',
    'auth/popup-blocked':
      'Pop-up diblokir browser. Izinkan pop-up untuk login dengan Google.',
    'auth/account-exists-with-different-credential':
      'Email ini sudah terdaftar dengan metode login berbeda. Coba masuk dengan metode lain.',
    'auth/user-disabled':
      'Akun ini telah dinonaktifkan. Hubungi dukungan untuk bantuan.',
    'auth/requires-recent-login':
      'Sesi kamu sudah habis. Silakan masuk kembali untuk melanjutkan.',
    'auth/expired-action-code':
      'Tautan sudah kedaluwarsa. Minta tautan baru.',
    'auth/invalid-action-code':
      'Tautan tidak valid atau sudah digunakan.',
    // Firestore errors
    'permission-denied':
      'Akses ditolak. Kamu tidak memiliki izin untuk tindakan ini.',
    'unavailable':
      'Layanan sedang tidak tersedia. Coba lagi dalam beberapa saat.',
    'not-found':
      'Data yang dicari tidak ditemukan.',
    'already-exists':
      'Data ini sudah ada sebelumnya.',
    'resource-exhausted':
      'Batas penggunaan tercapai. Coba lagi nanti.',
    // Default
    'default':
      'Terjadi kesalahan yang tidak terduga. Silakan coba lagi.'
  }
  return messages[errorCode] || messages['default']
}

export const getGeminiErrorMessage = (error: any) => {
  if (error.message?.includes('429')) return 'AI sedang sibuk. Tunggu beberapa detik dan coba lagi.'
  if (error.message?.includes('500')) return 'Server AI sedang bermasalah. Coba lagi nanti.'
  if (error.message?.includes('network')) return 'Koneksi bermasalah saat menghubungi AI.'
  return 'AI tidak dapat merespons saat ini. Coba lagi.'
}
