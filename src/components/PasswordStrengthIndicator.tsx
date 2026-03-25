"use client";

interface Props {
  password: string;
  dark?: boolean; // true = white text (register page), false = dark text (profile)
}

function getStrength(password: string): {
  score: number;
  label: string;
  color: string;
  barColor: string;
  tips: string[];
} {
  const tips: string[] = [];
  let score = 0;

  const hasMin8 = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);

  if (hasMin8) score++;
  else tips.push("At least 8 characters");

  if (hasLetter && hasNumber) score++;
  else {
    if (!hasLetter) tips.push("Add letters");
    if (!hasNumber) tips.push("Add numbers");
  }

  if (hasUpper && hasLower) score++;
  else tips.push("Mix uppercase & lowercase");

  if (hasSpecial) score++;
  else tips.push("Add a special character (!@#$...)");

  if (password.length >= 12) score++;

  if (score <= 1) return { score, label: "Weak", color: "text-red-400", barColor: "bg-red-500", tips };
  if (score === 2) return { score, label: "Fair", color: "text-orange-400", barColor: "bg-orange-500", tips };
  if (score === 3) return { score, label: "Good", color: "text-yellow-400", barColor: "bg-yellow-500", tips };
  if (score === 4) return { score, label: "Strong", color: "text-green-400", barColor: "bg-green-500", tips };
  return { score, label: "Very Strong", color: "text-emerald-400", barColor: "bg-emerald-500", tips };
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[a-zA-Z]/.test(password)) return "Password must contain at least one letter.";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number.";
  return null; // valid
}

export default function PasswordStrengthIndicator({ password, dark = false }: Props) {
  if (!password) return null;

  const { score, label, color, barColor, tips } = getStrength(password);
  const segments = 5;

  return (
    <div className="mt-2 space-y-2">
      {/* Bar */}
      <div className="flex gap-1">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i < score ? barColor : dark ? "bg-white/20" : "bg-slate-200"
            }`}
          />
        ))}
      </div>

      {/* Label */}
      <p className={`text-xs font-semibold ${color}`}>{label}</p>

      {/* Tips */}
      {tips.length > 0 && (
        <ul className="space-y-1">
          {tips.map((tip, i) => (
            <li
              key={i}
              className={`text-xs flex items-center gap-1.5 ${
                dark ? "text-white/50" : "text-slate-500"
              }`}
            >
              <span className="text-orange-400">•</span>
              {tip}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
