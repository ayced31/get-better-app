// ─── Input Component ────────────────────────────────────────────
import { type InputHTMLAttributes, forwardRef } from 'react';
import './Input.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  inputSize?: 'sm' | 'md' | 'lg';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, inputSize = 'md', className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    const inputClasses = [
      'input',
      inputSize !== 'md' && `input--${inputSize}`,
      error && 'input--error',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className="input-group">
        {label && (
          <label className="input-label" htmlFor={inputId}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={inputClasses}
          {...props}
        />
        {error && <span className="input-error-text">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
