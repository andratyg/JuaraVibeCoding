import { ReactNode } from 'react';
import { useApp } from '../../App';

export default function ThemeWrapper({ children }: { children: ReactNode }) {
  const { profile, theme } = useApp();
  const energyScore = profile?.energyScore || 5;
  const accessibility = profile?.settings?.accessibility;

  const getThemeClass = () => {
    let classes = '';
    if (energyScore >= 7) classes += 'theme-high ';
    else if (energyScore >= 4) classes += 'theme-medium ';
    else classes += 'theme-low ';

    if (theme === 'dark') classes += 'dark ';
    else if (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches) classes += 'dark ';

    if (accessibility?.highContrast) classes += 'high-contrast ';

    return classes.trim();
  };

  const getRootStyles = () => {
    const scale = accessibility?.fontScale || 1;
    return {
      fontSize: `${scale * 100}%`,
    };
  };

  return (
    <div className={`contents ${getThemeClass()}`} style={getRootStyles() as any}>
      <style>{`
        .theme-high {
          --primary: #0d9488; /* teal-600 */
          --primary-light: #f0fdfa; /* teal-50 */
          --accent: #f59e0b; /* amber-500 */
        }
        .theme-medium {
          --primary: #4f46e5; /* indigo-600 */
          --primary-light: #f5f3ff; /* indigo-50 */
          --accent: #ec4899; /* pink-500 */
        }
        .theme-low {
          --primary: #e11d48; /* rose-600 */
          --primary-light: #fff1f2; /* rose-50 */
          --accent: #7c3aed; /* violet-600 */
        }
        
        .high-contrast {
          --primary: #000000;
          --accent: #000000;
          --primary-light: #ffffff;
        }

        .dark .bg-white { background-color: #0f172a !important; }
        .dark .bg-slate-50 { background-color: #020617 !important; }
        .dark .text-slate-900 { color: #f1f5f9 !important; }
        .dark .text-slate-600 { color: #94a3b8 !important; }
        .dark .text-slate-500 { color: #64748b !important; }
        .dark .border-slate-100 { border-color: #1e293b !important; }
        .dark .border-slate-200 { border-color: #334155 !important; }
        .dark .bg-slate-100 { background-color: #1e293b !important; }
        
        ${accessibility?.reducedMotion ? `
          * {
            animation-duration: 0.001ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.001ms !important;
          }
        ` : ''}
      `}</style>
      {children}
    </div>
  );
}
