import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../App';
import { db, handleFirestoreError, OperationType } from '../config/firebase';
import { collection, getDocs, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Bar
} from 'recharts';
import { TrendingUp, Activity, Target, Brain, Download, Loader2, Sparkles, FileText, CheckCircle2, Zap, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fadeInUp, itemFadeIn } from '../utils/animations';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { SkeletonPage } from '../components/ui/Skeletons';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'react-hot-toast';

export default function Analytics() {
  const { t } = useTranslation();
  const { profile } = useApp();
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    avgEnergy: 0,
    tasksDone: 0,
    focusRate: 0,
    wellnessIndex: 0
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.id) return;
      
      try {
        setLoading(true);
        const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        const aggregated = new Map();

        const getLocalDateStr = (d: Date) => {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };

        for (let i = 0; i < 7; i++) {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          const dayName = days[d.getDay()];
          const dateStr = getLocalDateStr(d);
          aggregated.set(dateStr, { day: dayName, score: 0, count: 0, tasks: 0, wellness: 0 });
        }

        const energyPath = `users/${profile.id}/energyCheckIns`;
        const energyQuery = query(collection(db, energyPath), orderBy('createdAt', 'desc'), limit(50));
        const energySnap = await getDocs(energyQuery).catch(e => {
          if (e.message?.includes('offline')) {
            console.warn('Energy analytic fetch: client is offline');
            return { docs: [] } as any;
          }
          throw e;
        });

        energySnap.docs.forEach(doc => {
          const d = doc.data();
          let date = d.createdAt instanceof Timestamp ? d.createdAt.toDate() : new Date(d.createdAt);
          const dateStr = getLocalDateStr(date);
          if (aggregated.has(dateStr)) {
            const current = aggregated.get(dateStr);
            current.score += (d.score || 0);
            current.count += 1;
            aggregated.set(dateStr, current);
          }
        });

        const tasksPath = `users/${profile.id}/tasks`;
        const tasksSnap = await getDocs(collection(db, tasksPath)).catch(e => {
          if (e.message?.includes('offline')) {
            console.warn('Tasks analytic fetch: client is offline');
            return { docs: [] } as any;
          }
          throw e;
        });

        tasksSnap.docs.forEach(doc => {
          const d = doc.data();
          if (d.status !== 'Completed' && !d.completed) return;
          let date = d.createdAt instanceof Timestamp ? d.createdAt.toDate() : new Date(d.createdAt);
          const dateStr = getLocalDateStr(date);
          if (aggregated.has(dateStr)) {
            const current = aggregated.get(dateStr);
            current.tasks += 1;
            aggregated.set(dateStr, current);
          }
        });

        const finalData = Array.from(aggregated.entries()).map(([_, val]: [string, any]) => {
          const avgScore = val.count > 0 ? Math.round(val.score / val.count * 10) / 10 : 0;
          const wellness = Math.round((avgScore * 6) + (Math.min(val.tasks, 10) * 4));
          return { ...val, score: avgScore, wellness: Math.min(100, wellness), hasData: val.count > 0 || val.tasks > 0 };
        });

        const activeDays = finalData.filter(d => d.hasData);
        const totalTasks = finalData.reduce((acc, curr) => acc + curr.tasks, 0);
        const totalEnergy = finalData.reduce((acc, curr) => acc + curr.score, 0);
        const avgEnergy = activeDays.length > 0 ? totalEnergy / activeDays.length : 0;
        const totalWellness = finalData.reduce((acc, curr) => acc + curr.wellness, 0);
        const avgWellness = activeDays.length > 0 ? Math.round(totalWellness / activeDays.length) : 0;

        setStats({
          avgEnergy: Math.round(avgEnergy * 10) / 10,
          tasksDone: totalTasks,
          focusRate: Math.min(100, Math.round((totalTasks / 14) * 100)),
          wellnessIndex: avgWellness
        });

        setData(finalData);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, `users/${profile.id}/analytics`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [profile?.id]);

  const exportPDF = async () => {
    const el = document.getElementById('analytics-content');
    if (!el) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#0f172a' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.setFillColor(15, 23, 42);
      pdf.rect(0, 0, 210, 297, 'F');
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`Laporan-Analitik-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Laporan berhasil diunduh!');
    } catch (error) {
      toast.error('Gagal mengekspor laporan.');
    } finally {
      setExporting(false);
    }
  };

  const moodData = [
    { name: 'Produktif', value: 40, color: 'var(--accent)' },
    { name: 'Fokus', value: 30, color: 'var(--accent2)' },
    { name: 'Santai', value: 20, color: '#10b981' },
    { name: 'Stres', value: 10, color: '#ef4444' },
  ];

  if (loading) return <SkeletonPage />;

  return (
    <motion.div {...fadeInUp} id="analytics-content" className="space-y-6 md:space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Analitik Performa</h1>
          <p className="text-sm" style={{ color: 'var(--text2)' }}>Pantau pertumbuhan dan produktivitas kamu melalui data.</p>
        </div>
        <Button
          onClick={exportPDF}
          loading={exporting}
          variant="outline"
          icon={Download}
        >
          Ekspor Laporan
        </Button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Rata-rata Energi" value={stats.avgEnergy.toString()} unit="/10" icon={TrendingUp} trend="+12%" />
        <StatCard label="Tugas Selesai" value={stats.tasksDone.toString()} unit="Total" icon={Target} trend={`+${stats.tasksDone}`} />
        <StatCard label="Skor Fokus" value={stats.focusRate.toString()} unit="%" icon={Activity} trend="Stabil" />
        <StatCard label="Indeks Wellness" value={stats.wellnessIndex.toString()} unit="%" icon={Brain} trend="+4%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Trend Energy */}
        <Card className="lg:col-span-8 p-6 md:p-8 space-y-6">
           <div className="flex justify-between items-center">
             <h3 className="font-bold text-lg">Tren Energi Mingguan</h3>
             <div className="flex items-center gap-2 text-xs font-bold opacity-50">
               <div className="h-2 w-2 rounded-full bg-[var(--accent)]" /> Skor Energi
             </div>
           </div>
           <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.1} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--text3)' }} dy={10} />
                <YAxis hide domain={[0, 10]} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="score" stroke="var(--accent)" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" animationDuration={1500} />
                </AreaChart>
            </ResponsiveContainer>
           </div>
        </Card>

        {/* Mood Distribution */}
        <Card className="lg:col-span-4 p-6 md:p-8 flex flex-col items-center">
            <h3 className="font-bold text-lg mb-8 text-center">Peta Suasana Hati</h3>
            <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={moodData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {moodData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <RechartsTooltip />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="w-full space-y-3 mt-6">
                {moodData.map(m => (
                    <div key={m.name} className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full" style={{ background: m.color }}></div>
                            <span className="opacity-50">{m.name}</span>
                        </div>
                        <span>{m.value}%</span>
                    </div>
                ))}
            </div>
        </Card>

        {/* Wellness vs Productivity */}
        <Card className="lg:col-span-12 p-8 space-y-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5">
                <Brain className="h-40 w-40 text-[var(--accent)]" />
            </div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
                <div className="space-y-1">
                   <h3 className="text-xl font-bold tracking-tight">Produktivitas vs Wellness</h3>
                   <p className="text-sm opacity-60 font-medium">Keseimbangan antara hasil kerja dan kesehatan mentalmu.</p>
                </div>
                <div className="flex items-center gap-4 bg-[var(--surface)] p-2 rounded-2xl border border-[var(--border)]">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--surface2)] rounded-xl">
                        <div className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                        <span className="text-[10px] font-bold uppercase opacity-60">Tugas</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--surface2)] rounded-xl">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-bold uppercase opacity-60">Wellness</span>
                    </div>
                </div>
            </div>
            
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.1} />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: 'var(--text3)' }} dy={10} />
                        <YAxis yAxisId="left" hide domain={[0, 'auto']} />
                        <YAxis yAxisId="right" orientation="right" hide domain={[0, 100]} />
                        <RechartsTooltip 
                           contentStyle={{ backgroundColor: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '12px' }}
                        />
                        <Bar yAxisId="left" dataKey="tasks" fill="var(--accent)" radius={[8, 8, 0, 0]} barSize={24} />
                        <Line yAxisId="right" type="monotone" dataKey="wellness" stroke="#10b981" strokeWidth={4} dot={{ fill: '#10b981', r: 5 }} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 pt-4">
                <div className="p-5 bg-[var(--surface)] rounded-2xl border border-[var(--border)] space-y-2">
                    <h5 className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-widest">Insight Utama</h5>
                    <p className="text-xs font-medium leading-relaxed opacity-70">
                        Produktivitasmu memuncak saat level wellness di atas 70%.
                    </p>
                </div>
                <div className="p-5 bg-[var(--surface)] rounded-2xl border border-[var(--border)] space-y-2">
                    <h5 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Wellness Index</h5>
                    <p className="text-xs font-medium leading-relaxed opacity-70">
                        Rata-rata indeks kamu minggu ini adalah {stats.wellnessIndex}%. Sangat stabil.
                    </p>
                </div>
                <div className="p-5 bg-[var(--surface)] rounded-2xl border border-[var(--border)] space-y-2">
                    <h5 className="text-[10px] font-bold text-[var(--accent2)] uppercase tracking-widest">Tip Optimasi</h5>
                    <p className="text-xs font-medium leading-relaxed opacity-70">
                        Lakukan Deep Work di pagi hari saat energi kamu sedang di puncak.
                    </p>
                </div>
            </div>
        </Card>

        {/* Narrative */}
        <Card className="lg:col-span-12 md:p-10 p-8 border-none bg-slate-900 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[var(--accent)]/10 rounded-full blur-[100px] -mr-40 -mt-40" />
            
            <div className="relative z-10 space-y-8">
                <div className="inline-flex items-center gap-3 bg-white/5 px-5 py-2 rounded-full border border-white/10">
                   <Sparkles className="h-4 w-4 text-[var(--accent)]" />
                   <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Narasi AI Mingguan</span>
                </div>
                
                <h3 className="text-2xl md:text-3xl font-bold leading-tight tracking-tight max-w-2xl">Keseimbangan adalah Kunci Kesuksesanmu.</h3>
                
                <p className="text-slate-400 leading-relaxed text-lg font-medium border-l-4 border-[var(--accent)]/50 pl-8 italic">
                    "Berdasarkan data minggu ini, terlihat korelasi positif antara energi pagi dengan penyelesaian tugas besar. Tingkat wellness kamu yang stabil membantu menjaga fokus tetap tajam. Pertahankan ritme istirahat di tengah kesibukan."
                </p>
                
                <div className="flex items-center gap-4 text-xs font-bold text-[var(--accent)]">
                  <ArrowUpRight size={16} /> Dianalisis dari data performa aktif kamu
                </div>
            </div>
        </Card>
      </div>
    </motion.div>
  );
}

function StatCard({ label, value, unit, icon: Icon, trend }: any) {
  return (
    <Card className="p-6 space-y-4 hover:border-[var(--accent)] transition-all">
      <div className="flex justify-between items-start">
        <div className="p-3 bg-[var(--surface)] text-[var(--accent)] rounded-xl">
          <Icon size={20} />
        </div>
        <div className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded-lg border border-emerald-500/20">
          {trend}
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">{label}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold">{value}</span>
          <span className="text-xs font-medium opacity-40">{unit}</span>
        </div>
      </div>
    </Card>
  );
}
