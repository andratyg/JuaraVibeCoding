import { useState, useEffect } from 'react';
import { useApp } from '../App';
import { db } from '../lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { 
  LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { TrendingUp, Activity, Target, Brain, Download, Loader2, Sparkles, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function Analytics() {
  const { profile } = useApp();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

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
    
    setExporting(true);
    try {
      // Small delay to ensure any hover states/tooltips are gone
      await new Promise(r => setTimeout(r, 200));

      const canvas = await html2canvas(el, {
        scale: 2, // Higher resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200, // Fixed width for consistent layout in PDF
        onclone: (clonedDoc) => {
          // Remove ALL existing stylesheets and style tags in the clone
          // html2canvas fails if it parses ANY rule containing oklch
          const styles = Array.from(clonedDoc.getElementsByTagName('style'));
          const links = Array.from(clonedDoc.getElementsByTagName('link'));
          
          styles.forEach(s => s.remove());
          links.forEach(l => {
            if (l.rel === 'stylesheet') l.remove();
          });

          // Also scrub any inline styles that might use modern color functions
          clonedDoc.querySelectorAll('*').forEach(node => {
            const el = node as HTMLElement;
            if (el.style) {
              const style = el.getAttribute('style');
              if (style && (style.includes('oklch') || style.includes('oklab'))) {
                // Replace both oklch and oklab with a safe fallback
                el.setAttribute('style', style.replace(/(oklch|oklab)\([^)]+\)/g, '#64748b'));
              }
            }
          });

          // Re-inject a clean, basic stylesheet using only standard HEX/RGB
          const style = clonedDoc.createElement('style');
          style.innerHTML = `
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800&display=swap');
            
            body, html {
              background-color: #ffffff !important;
              color: #0f172a !important;
              font-family: 'Plus Jakarta Sans', sans-serif !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            #analytics-content {
              background-color: #ffffff !important;
              padding: 40px !important;
              width: 1100px !important; /* Slightly narrower to fit A4 aspect better */
              margin: 0 auto !important;
            }

            .grid { display: grid !important; gap: 24px !important; }
            .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)) !important; }
            .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
            .lg\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
            .lg\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }

            .flex { display: flex !important; }
            .items-center { align-items: center !important; }
            .justify-between { justify-content: space-between !important; }
            .gap-3 { gap: 12px !important; }
            .gap-6 { gap: 24px !important; }

            .bg-white { background-color: #ffffff !important; }
            .bg-slate-50 { background-color: #f8fafc !important; }
            .bg-slate-900 { background-color: #0f172a !important; }
            .bg-indigo-50 { background-color: #eef2ff !important; }
            .bg-emerald-50 { background-color: #ecfdf5 !important; }
            .bg-amber-50 { background-color: #fffbeb !important; }
            .bg-rose-50 { background-color: #fff1f2 !important; }

            .text-slate-900 { color: #0f172a !important; }
            .text-slate-800 { color: #1e293b !important; }
            .text-slate-600 { color: #475569 !important; }
            .text-slate-400 { color: #94a3b8 !important; }
            .text-indigo-600 { color: #4f46e5 !important; }
            .text-emerald-600 { color: #059669 !important; }
            .text-amber-600 { color: #d97706 !important; }
            .text-rose-600 { color: #e11d48 !important; }

            .rounded-[2.5rem] { border-radius: 40px !important; }
            .rounded-xl { border-radius: 12px !important; }
            .rounded-lg { border-radius: 8px !important; }
            
            .border { border: 1px solid #f1f5f9 !important; }
            .border-b { border-bottom: 1px solid #f1f5f9 !important; }
            .border-slate-100 { border-color: #f1f5f9 !important; }
            
            .font-bold { font-weight: 700 !important; }
            .font-black { font-weight: 800 !important; }
            
            .p-8 { padding: 32px !important; }
            .mb-8 { margin-bottom: 32px !important; }
            .mb-12 { margin-bottom: 48px !important; }

            /* Hide buttons and interactive elements */
            button, .lucide-download { display: none !important; }

            /* Ensure charts have some size */
            .recharts-responsive-container { min-height: 320px !important; }
          `;
          clonedDoc.head.appendChild(style);
        }
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // First page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      // Subsequent pages if content overflows
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      pdf.save(`FlowState-Weekly-Report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF Export failed:', error);
    } finally {
      setExporting(false);
    }
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
          disabled={exporting}
          className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-black transition-all disabled:opacity-50"
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {exporting ? 'Generating PDF...' : 'Export PDF'}
        </button>
      </div>

      <div id="pdf-report-header" className="hidden print:block mb-8 border-b-2 border-slate-900 pb-4">
        <div className="flex justify-between items-end">
            <div>
                <h2 className="text-2xl font-black text-slate-900">FLOWSTATE PREMIUM REPORT</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Wellness & Productivity Intelligence</p>
            </div>
            <div className="text-right">
                <p className="text-xs font-bold text-slate-900">{new Date().toLocaleDateString()}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client: {profile?.name}</p>
            </div>
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-8">Produktifitas vs Wellness</h3>
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#94a3b8' }} />
                        <Tooltip />
                        <Bar dataKey="tasks" name="Tasks" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="wellness" name="Wellness %" fill="#ccfbf1" radius={[4, 4, 0, 0]} />
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

      {/* Detailed Data Table */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <FileText size={20} />
            </div>
            <h3 className="font-bold text-slate-800">Raw Data Inventory</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-slate-50">
                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Day</th>
                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Energy Score</th>
                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Tasks Completed</th>
                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Wellness Index</th>
                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {data.map((row) => (
                        <tr key={row.day} className="group hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 font-bold text-slate-600">{row.day}</td>
                            <td className="py-4 text-center">
                                <span className={cn(
                                    "inline-block px-2 py-1 rounded-lg text-[10px] font-black",
                                    row.score > 7 ? "bg-emerald-50 text-emerald-600" : row.score > 4 ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                                )}>
                                    {row.score}/10
                                </span>
                            </td>
                            <td className="py-4 text-center font-bold text-slate-900">{row.tasks}</td>
                            <td className="py-4 text-center font-mono text-xs">{row.wellness}%</td>
                            <td className="py-4 text-right">
                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Verified</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}

// Helper for conditional classes
function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
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
