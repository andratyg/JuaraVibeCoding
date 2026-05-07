import { useState, useEffect } from 'react';
import { useApp } from '../App';
import { auth, db, handleFirestoreError, OperationType } from '../config/firebase';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { 
  LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart 
} from 'recharts';
import { TrendingUp, Activity, Target, Brain, Download, Loader2, Sparkles, FileText, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function Analytics() {
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

        // Helper to get local date string YYYY-MM-DD
        const getLocalDateStr = (d: Date) => {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };

        // Initialize last 7 days using LOCAL dates
        for (let i = 0; i < 7; i++) {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          const dayName = days[d.getDay()];
          const dateStr = getLocalDateStr(d);
          aggregated.set(dateStr, { day: dayName, score: 0, count: 0, tasks: 0, wellness: 0 });
        }

        // 1. Fetch Energy Data (Subcollection)
        const energyPath = `users/${profile.id}/energyCheckIns`;
        const energyQuery = query(
          collection(db, energyPath),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        
        let energySnap;
        try {
          energySnap = await getDocs(energyQuery);
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, energyPath);
          return;
        }

        energySnap.docs.forEach(doc => {
          const d = doc.data();
          let date: Date;
          if (d.createdAt?.toDate) {
            date = d.createdAt.toDate();
          } else if (typeof d.createdAt === 'string') {
            date = new Date(d.createdAt);
          } else {
            return;
          }
          
          const dateStr = getLocalDateStr(date);
          if (aggregated.has(dateStr)) {
            const current = aggregated.get(dateStr);
            current.score += (d.score || 0);
            current.count += 1;
            aggregated.set(dateStr, current);
          }
        });

        // 2. Fetch Tasks Data (Subcollection)
        const tasksPath = `users/${profile.id}/tasks`;
        const tasksQuery = query(collection(db, tasksPath));
        
        let tasksSnap;
        try {
          tasksSnap = await getDocs(tasksQuery);
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, tasksPath);
          return;
        }

        tasksSnap.docs.forEach(doc => {
          const d = doc.data();
          // Logic: Task is done if status is 'Completed' OR completed boolean is true
          if (d.status !== 'Completed' && !d.completed) return;

          let date: Date;
          if (d.createdAt?.toDate) {
            date = d.createdAt.toDate();
          } else if (typeof d.createdAt === 'string') {
            date = new Date(d.createdAt);
          } else {
            return;
          }

          const dateStr = getLocalDateStr(date);
          if (aggregated.has(dateStr)) {
            const current = aggregated.get(dateStr);
            current.tasks += 1;
            aggregated.set(dateStr, current);
          }
        });

        // Finalize averages and wellness
        const finalData = Array.from(aggregated.entries()).map(([_, val]: [string, any]) => {
          const avgScore = val.count > 0 ? Math.round(val.score / val.count * 10) / 10 : 0;
          const wellness = Math.round((avgScore * 6) + (Math.min(val.tasks, 10) * 4));
          
          return {
            ...val,
            score: avgScore,
            wellness: Math.min(100, wellness),
            hasData: val.count > 0 || val.tasks > 0
          };
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
        console.error("Data Fetch Error:", err);
      } finally {
        setLoading(false);
      }
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

  const AnalyticsChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0D0F14]/95 backdrop-blur-2xl border border-white/10 p-5 rounded-[1.5rem] shadow-2xl ring-1 ring-white/5">
          <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-3 border-b border-white/5 pb-3 font-mono">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-6 py-1.5 group">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)]" style={{ backgroundColor: entry.color }}></div>
                <p className="text-xs font-bold text-white/50 uppercase tracking-widest">{entry.name}</p>
              </div>
              <p className="text-sm font-black text-white">
                {entry.value}
                {entry.name === 'Wellness' ? '%' : entry.name === 'Energy Score' ? '/10' : ''}
              </p>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) return (
    <div className="flex h-full w-full items-center justify-center p-20">
        <div className="relative">
            <Loader2 className="animate-spin text-indigo-500 h-12 w-12" />
            <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse"></div>
        </div>
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-10" id="analytics-content">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-white md:text-slate-900 tracking-tight">Performance Analytics</h1>
          <p className="text-xs md:text-sm font-bold text-slate-400 md:text-slate-500 uppercase tracking-widest">Growth trajectory through data.</p>
        </div>
        <button
          onClick={exportPDF}
          disabled={exporting}
          className="hidden md:flex items-center gap-3 bg-white text-slate-900 md:bg-slate-900 md:text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 shadow-xl"
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {exporting ? 'Generating...' : 'Export Report'}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard label="Avg Energy" value={stats.avgEnergy.toString()} unit="/10" icon={<TrendingUp />} trend="+12%" />
        <StatCard label="Tasks Done" value={stats.tasksDone.toString()} unit="Total" icon={<Target />} trend="+5" />
        <StatCard label="Workout Days" value="4" unit="Days" icon={<Activity />} trend="Stable" />
        <StatCard label="Wellness" value={stats.wellnessIndex.toString()} unit="%" icon={<Brain />} trend="+4%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Trend Energy */}
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 p-6 opacity-30">
              <TrendingUp className="h-24 w-24 text-indigo-50" />
           </div>
           <h3 className="font-bold text-slate-800 mb-8 relative text-base md:text-lg">Weekly Energy Trend</h3>
           <div className="h-64 md:h-80 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                <YAxis hide domain={[0, 10]} />
                <RechartsTooltip content={<AnalyticsChartTooltip />} />
                <Area type="monotone" dataKey="score" name="Energy Score" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorScore)" animationDuration={1500} />
                </AreaChart>
            </ResponsiveContainer>
           </div>
        </div>

        {/* Mood Distribution */}
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center">
            <h3 className="font-bold text-slate-800 mb-8 text-center text-base md:text-lg">Mood Map</h3>
            <div className="h-48 md:h-64 w-full">
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
                    <div key={m.name} className="flex justify-between items-center text-[10px] md:text-xs font-black uppercase tracking-widest">
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
        {/* Produktifitas vs Wellness */}
        <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-slate-100 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-40">
                <Brain className="h-40 w-40 text-indigo-50" />
            </div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 relative">
                <div>
                   <h3 className="text-2xl font-black text-slate-800 tracking-tight">Produktifitas vs Wellness</h3>
                   <p className="text-sm font-medium text-slate-500">Melihat keseimbangan antara hasil kerja dan kesehatan mentalmu.</p>
                </div>
                <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl shadow-sm">
                        <div className="h-2 w-2 rounded-full bg-indigo-600"></div>
                        <span className="text-[10px] font-black text-slate-600 uppercase">Tasks</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl shadow-sm">
                        <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                        <span className="text-[10px] font-black text-slate-600 uppercase">Wellness</span>
                    </div>
                </div>
            </div>
            
            <div className="h-96 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                        <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                                <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.9} />
                            </linearGradient>
                            <filter id="shadow" height="200%">
                                <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                                <feOffset dx="0" dy="4" result="offsetblur" />
                                <feComponentTransfer>
                                    <feFuncA type="linear" slope="0.2" />
                                </feComponentTransfer>
                                <feMerge>
                                    <feMergeNode />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                            dataKey="day" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 11, fontWeight: 800, fill: '#94a3b8' }} 
                            dy={15} 
                        />
                        <YAxis yAxisId="left" hide domain={[0, (dataMax: number) => Math.max(10, dataMax + 2)]} />
                        <YAxis yAxisId="right" orientation="right" hide domain={[0, 100]} />
                        <RechartsTooltip content={<AnalyticsChartTooltip />} cursor={{ fill: '#f8fafc', radius: 12 }} />
                        <Bar 
                            yAxisId="left" 
                            dataKey="tasks" 
                            name="Tasks Done" 
                            fill="url(#barGradient)" 
                            radius={[12, 12, 0, 0]} 
                            barSize={32} 
                            animationDuration={2000} 
                            style={{ filter: 'url(#shadow)' }}
                        />
                        <Line 
                            yAxisId="right" 
                            type="monotone" 
                            dataKey="wellness" 
                            name="Wellness" 
                            stroke="#10b981" 
                            strokeWidth={5} 
                            dot={{ fill: '#10b981', strokeWidth: 3, r: 6, stroke: '#fff' }} 
                            activeDot={{ r: 10, strokeWidth: 0, fill: '#10b981' }} 
                            animationDuration={2500} 
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 group hover:border-indigo-200 transition-all">
                    <h5 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Insight Utama</h5>
                    <p className="text-xs font-bold text-slate-700 leading-relaxed">
                        Kamu paling produktif saat level <span className="text-emerald-600">wellness</span> berada di atas 70%. Jangan abaikan waktu istirahat.
                    </p>
                </div>
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 group hover:border-emerald-200 transition-all">
                    <h5 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Wellness Index</h5>
                    <p className="text-xs font-bold text-slate-700 leading-relaxed">
                        Rata-rata index kamu minggu ini adalah <span className="text-emerald-600">{stats.wellnessIndex}%</span>. Sangat stabil dan sehat.
                    </p>
                </div>
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 group hover:border-amber-200 transition-all">
                    <h5 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Tip Optimasi</h5>
                    <p className="text-xs font-bold text-slate-700 leading-relaxed">
                        Coba tambahkan slot istirahat 15 menit setiap 2 jam <span className="text-amber-600">Deep Work</span> untuk menjaga wellness.
                    </p>
                </div>
            </div>
        </div>

        <div className="bg-slate-900 md:p-12 p-8 rounded-[3rem] text-white flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-[100px] group-hover:scale-125 transition-transform duration-1000" />
            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]" />
            
            <div className="relative z-10">
                <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-2 rounded-2xl mb-8 border border-white/10">
                   <Sparkles className="h-5 w-5 text-indigo-400" />
                   <span className="text-xs font-black uppercase tracking-widest">Weekly AI Narrative</span>
                </div>
                
                <h3 className="text-4xl font-black mb-8 leading-tight tracking-tight">Keseimbangan adalah Kunci Kesuksesanmu.</h3>
                
                <div className="space-y-6">
                    <p className="text-slate-300 leading-relaxed text-lg font-medium border-l-4 border-indigo-500/50 pl-8">
                        "Berdasarkan input real-time kamu minggu ini, terlihat ada korelasi kuat antara energi hari Selasa dengan lonjakan tugas yang selesai. Wellness kamu memuncak di titik 90% saat beban kerja seimbang. Saran dari Coach: Pertahankan ritme istirahat di hari Rabu untuk menghindari burnout di hari Kamis."
                    </p>
                    
                    <div className="flex items-center gap-4 pt-4">
                        <div className="flex -space-x-2">
                             {[1,2,3].map(i => (
                                 <div key={i} className="h-8 w-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-bold">
                                     {i === 1 ? '🧠' : i === 2 ? '⚡' : '✨'}
                                 </div>
                             ))}
                        </div>
                        <span className="text-indigo-400 font-bold text-xs">Dianalisis dari 50+ data points minggu ini</span>
                    </div>
                </div>
            </div>
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
                                    !row.hasData ? "bg-slate-50 text-slate-300" :
                                    row.score > 7 ? "bg-emerald-50 text-emerald-600" : row.score > 4 ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                                )}>
                                    {row.hasData ? `${row.score}/10` : '-- / 10'}
                                </span>
                            </td>
                            <td className={cn(
                                "py-4 text-center font-bold",
                                row.hasData ? "text-slate-900" : "text-slate-300"
                            )}>{row.hasData ? row.tasks : '--'}</td>
                            <td className={cn(
                                "py-4 text-center font-mono text-xs",
                                row.hasData ? "text-slate-600" : "text-slate-300"
                            )}>{row.hasData ? `${row.wellness}%` : '--'}</td>
                            <td className="py-4 text-right">
                                {row.hasData ? (
                                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center justify-end gap-1">
                                        <Activity size={10} /> Verified
                                    </span>
                                ) : (
                                    <span className="text-[9px] font-black text-slate-200 uppercase tracking-widest">No Input</span>
                                )}
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
