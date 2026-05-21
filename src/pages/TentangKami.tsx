import SEO from '../components/SEO';
import { motion } from 'framer-motion';
import Card from '../components/ui/Card';

export default function TentangKami() {
  return (
    <>
      <SEO 
        title="Tentang Kami — Velora" 
        description="Mengenal lebih dekat CEO dan visi Velora dalam membangun budaya kerja remote yang adaptif dan seimbang bagi pekerja di Indonesia."
      />
      <div className="max-w-4xl mx-auto space-y-8 p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">
            Tentang Kami &mdash; Velora
          </h1>
          <p className="text-[var(--text2)] text-lg leading-relaxed mb-6">
            Velora hadir sebagai solusi AI terpadu yang memadukan peran <strong>Wellness Coach</strong> dan <strong>Productivity Assistant</strong>, dirancang secara khusus untuk menjawab kebutuhan gaya hidup dan ritme para <em>remote worker</em> di Indonesia. Kami percaya bahwa produktivitas puncak bukan tentang bekerja lebih keras, melainkan tentang bekerja lebih cerdas dan menjaga keseimbangan energi.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="p-8 border-l-4 border-l-blue-500 bg-[var(--surface)]">
            <h2 className="text-2xl font-bold mb-6 text-[var(--text)]">Profil Kepemimpinan</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">[Nama CEO]</h3>
                <p className="text-sm text-[var(--text3)] uppercase tracking-wider mb-4">Founder & CEO, Velora</p>
                <div className="space-y-4 text-[var(--text2)] leading-relaxed">
                  <p>
                    Sebagai seorang inovator di industri teknologi, <strong>[Nama CEO]</strong> memiliki satu visi: mendefinisikan ulang makna produktivitas di era kerja fleksibel. Memiliki pengalaman bertahun-tahun dalam mengembangkan produk digital dan memimpin tim jarak jauh, beliau menyadari betul adanya celah besar antara tuntutan profesional dan kesehatan mental yang memengaruhi para pekerja masa kini.
                  </p>
                  <p>
                    Visi kepemimpinan [Nama CEO] bertumpu pada keyakinan bahwa <strong>"Efisiensi yang sejati lahir dari pikiran yang tangguh dan keseimbangan yang terjaga."</strong> Di bawah arahannya, <em>Velora</em> tidak sekadar berfokus pada seberapa banyak pekerjaan yang bisa diselesaikan, tetapi juga memprioritaskan "kapan kita harus beristirahat" dan "bagaimana kita mengelola energi".
                  </p>
                  <p>
                    Melalui pengembangan AI yang empati dan adaptif, [Nama CEO] berdedikasi membangun alat bantu cerdas yang mampu mendengarkan serta mempersonalisasi rutinitas harian pekerjan remot di Indonesia—memberdayakan setiap individu untuk tidak sekadar bertahan dalam mengejar tenggat waktu, melainkan bertumbuh, berkarya lebih tajam, dan tetap merawat kesejahteraan batin mereka.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </>
  );
}
