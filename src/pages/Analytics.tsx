import { useState, useEffect } from 'react';
import { useApp } from '../App';
import { db } from '../lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { 
  LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { TrendingUp, Activity, Target, Brain, Download, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function Analytics() {
  const { profile } = useApp();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return;
      // Mocking 7 days of data based on history for visualization
      const energyData = [
        { day: 'Sen', score: 6, tasks: 4, wellness: 80 },
        { day: 'Sel', score: 8, tasks: 7, wellness: 60 },
        { day: 'Rab', score: 4, tasks: 3, wellness: 90 },
        { day: 'Kam', score: 7, tasks: 6, wellness: 70 },
        { day: 'Jum', score: 9, tasks: 8, wellness: 40 },
        { day: 'Sab', score: 5, tasks: 2, wellness: 100 },
        { day: 'Min', score: profile.energyScore, tasks: 1, wellness: 95 },
      ];
      setData(energyData);
      setLoading(false);
    };
    fetchData();
  }, [profile]);

  const exportPDF = async () => {
    const el = document.getElementById('analytics-content');
    if (!el) return;
    const canvas = await html2canvas(el);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, width, height);
    pdf.save('FlowState-Weekly-Report.pdf');
  };

  const moodData = [
    { name: 'Produktif', value: 40, color: '#0d9488' },
    { name: 'Stres', value: 20, color: '#e11d48' },
    { name: 'Fokus', value: 30, color: '#4f46e5' },
    { name: 'Santai', value: 10, color: '#f59e0b' },
  ];

  if (loading) return (
    <div className="flex h-full w-full items-center justify-center p-20">
        <Loader2 className="animate-spin text-[var(--primary)] h-10 w-10" />
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto" id="analytics-content">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Weekly Analytics</h1>
          <p className="text-slate-500">Perjalanan pertumbuhanmu dalam data.</p>
        </div>
        <button
          onClick={exportPDF}
          className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-black transition-all"
        >
          <Download className="h-4 w-4" /> Export PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard label="Avg Energy" value="6.8" unit="/10" icon={<TrendingUp />} trend="+12%" />
        <StatCard label="Tasks Done" value="38" unit="Total" icon={<Target />} trend="+5" />
        <StatCard label="Workout Sessions" value="4" unit="Days" icon={<Activity />} trend="Stable" />
        <StatCard label="Focus Rate" value="74" unit="%" icon={<Brain />} trend="+4%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Trend Energy */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
           <h3 className="font-bold text-slate-800 mb-8">Tren Energi Mingguan</h3>
           <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#94a3b8' }} dy={10} />
                <YAxis hide domain={[0, 10]} />
                <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                 />
                <Area type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={4} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
            </ResponsiveContainer>
           </div>
        </div>

        {/* Mood Distribution */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
            <h3 className="font-bold text-slate-800 mb-8 text-center">Distribusi Mood</h3>
            <div className="h-64 mt-auto">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={moodData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {moodData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-auto">
                {moodData.map(m => (
                    <div key={m.name} className="flex justify-between items-center text-xs font-bold">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full" style={{ background: m.color }}></div>
                            <span className="text-slate-400">{m.name}</span>
                        </div>
                        <span className="text-slate-800">{m.value}%</span>
                    </div>
                ))}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-8">Produktifitas vs Wellness</h3>
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#94a3b8' }} />
                        <Tooltip />
                        <Bar dataKey="tasks" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="wellness" fill="#ccfbf1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-[var(--primary)] p-10 rounded-[2.5rem] text-white flex flex-col justify-center">
            <Sparkles className="h-10 w-10 mb-6 text-white/50" />
            <h3 className="text-3xl font-black mb-4 leading-tight">Weekly Narrative by Gemini</h3>
            <p className="text-white/80 leading-relaxed italic border-l-2 border-white/20 pl-6">
                "Minggu ini kamu menunjukkan konsistensi luar biasa di hari Selasa dan Jumat. Sesi Deep Work di pagi hari terbukti meningkatkan output task sebesar 20%. Namun, ada penurunan energi di pertengahan minggu. Saran Coach: Coba meditasi 5 menit ekstra di hari Rabu."
            </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, unit, icon, trend }: any) {
    return (
        <motion.div whileHover={{ scale: 1.02 }} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <div className="p-3 bg-slate-50 text-slate-400 rounded-xl">
                    {icon}
                </div>
                <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${
                    trend.includes('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'
                }`}>
                    {trend}
                </span>
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase mb-1">{label}</div>
            <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900">{value}</span>
                <span className="text-xs font-bold text-slate-400">{unit}</span>
            </div>
        </motion.div>
    );
}
