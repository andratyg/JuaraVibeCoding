import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';

export default function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8"
      >
        <div className="flex justify-center mb-6">
          <div className="h-20 w-20 bg-[var(--warning)]/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-10 w-10 text-[var(--warning)]" />
          </div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">404</h1>
        <h2 className="text-xl font-bold mb-4">Halaman Tidak Ditemukan</h2>
        <p className="text-[var(--text2)] text-sm mb-8 leading-relaxed">
          Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan.
          Silakan kembali ke dashboard utama sistem Pulse Anda.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-[var(--accent)] text-white px-6 py-3 rounded-lg font-bold hover:bg-[var(--accent)]/90 transition-colors"
        >
          <Home size={18} />
          Kembali ke Dashboard
        </Link>
      </motion.div>
    </div>
  );
}
