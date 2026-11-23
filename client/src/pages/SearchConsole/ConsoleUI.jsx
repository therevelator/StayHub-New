import React, { useState } from 'react';

// Small building blocks shared by the Booking Console screens.

export const MONO = 'font-mono uppercase text-[10px] tracking-[0.10em]';

export const Mono = ({ className = '', children, as: Tag = 'span' }) => (
  <Tag className={`${MONO} ${className}`}>{children}</Tag>
);

/** Striped placeholder used when a listing has no (working) photo. Pass `relative` or `absolute` in className. */
export const StripePlaceholder = ({ label, className = '' }) => (
  <div
    className={className}
    style={{ background: 'repeating-linear-gradient(135deg,#EFEBE4 0 8px,#E4DFD6 8px 16px)' }}
  >
    {label && (
      <span className="absolute left-2 bottom-2 font-mono text-[9px] uppercase tracking-[0.08em] bg-white/85 text-ink-500 px-1.5 py-0.5 rounded">
        {label}
      </span>
    )}
  </div>
);

/** Photo that degrades to the striped placeholder instead of a broken image. */
export const StayImg = ({ src, alt = '', label, className = '' }) => {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <StripePlaceholder label={label} className={className} />;
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
};

/** Real checkbox input styled as the 16px console checkbox. */
export const ConsoleCheckbox = ({ checked, onChange, label, count }) => (
  <label className="flex items-center gap-2.5 cursor-pointer min-h-[28px] group">
    <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
    <span
      aria-hidden="true"
      className={`w-4 h-4 rounded-[4px] border flex items-center justify-center flex-none text-[11px] leading-none transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-primary-300 ${
        checked ? 'bg-primary-500 border-primary-500 text-white' : 'bg-white border-gray-400 group-hover:border-primary-500'
      }`}
    >
      {checked ? '✓' : ''}
    </span>
    <span className="text-[13px] text-gray-800 flex-1">{label}</span>
    {count !== undefined && <span className="text-[11px] text-gray-400">{count}</span>}
  </label>
);

/** Toggle chip used in the filters sheet. */
export const ToggleChip = ({ on, onClick, children, disabled }) => (
  <button
    type="button"
    aria-pressed={on}
    disabled={disabled}
    onClick={onClick}
    className={`text-[13px] rounded-full px-[13px] py-[7px] border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
      on
        ? 'bg-primary-50 border-primary-500 text-primary-700'
        : 'bg-white border-gray-300 text-gray-700 hover:border-primary-500'
    }`}
  >
    {children}
  </button>
);

/** "← label" link-button used at the left of every console toolbar. */
export const BackLink = ({ onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className="text-[13px] text-gray-600 hover:bg-gray-100 rounded-[7px] px-2 py-1.5 transition-colors whitespace-nowrap"
  >
    ← {children}
  </button>
);

export const Toolbar = ({ children }) => (
  <div className="flex-none flex items-center gap-[14px] px-5 py-3 border-b border-gray-200 bg-white text-[14px] flex-wrap">
    {children}
  </div>
);
