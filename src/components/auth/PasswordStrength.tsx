export default function PasswordStrength({ password }: { password: string }) {
  const getStrength = (pass: string) => {
    if (pass.length === 0) return { level: 0, label: '', color: '' };
    if (pass.length < 6) return { level: 1, label: 'Lemah', color: 'bg-red-400' };
    if (pass.length < 10 || !/[0-9]/.test(pass)) return { level: 2, label: 'Sedang', color: 'bg-amber-400' };
    return { level: 3, label: 'Kuat', color: 'bg-teal-500' };
  };

  const strength = getStrength(password);

  return (
    <div className="mt-1 mb-3">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className={`flex-1 h-1 rounded-full transition-colors duration-300 ${
              i <= strength.level ? strength.color : 'bg-gray-100'
            }`}
          />
        ))}
      </div>
      {password && (
        <p className={`text-[11px] font-medium ${
          strength.level === 3 ? 'text-teal-600' : strength.level === 2 ? 'text-amber-600' : 'text-red-500'
        }`}>
          Kekuatan password: {strength.label}
        </p>
      )}
    </div>
  );
}
