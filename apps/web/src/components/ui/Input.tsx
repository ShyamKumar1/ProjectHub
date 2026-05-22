'use client';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-sm text-text-secondary font-medium">{label}</label>
      )}
      <input
        className={`
          w-full bg-dark-700 border border-dark-300 rounded-lg px-4 py-2.5
          text-text-primary text-sm placeholder:text-text-muted
          focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent
          transition-all duration-300
          ${error ? 'border-danger' : ''}
          ${className || ''}
        `}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, ...props }: TextareaProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-sm text-text-secondary font-medium">{label}</label>
      )}
      <textarea
        className={`
          w-full bg-dark-700 border border-dark-300 rounded-lg px-4 py-2.5
          text-text-primary text-sm placeholder:text-text-muted
          focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent
          transition-all duration-300 resize-none
          ${error ? 'border-danger' : ''}
          ${className || ''}
        `}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className, ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-sm text-text-secondary font-medium">{label}</label>
      )}
      <select
        className={`
          w-full bg-dark-700 border border-dark-300 rounded-lg px-4 py-2.5
          text-text-primary text-sm
          focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent
          transition-all duration-300
          ${className || ''}
        `}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
