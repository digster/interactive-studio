import { useEffect, useRef, useState } from 'react';

interface InlineInputProps {
  defaultValue?: string;
  selectNameOnly?: boolean;
  onSubmit: (value: string) => void;
  onCancel: () => void;
  placeholder?: string;
}

export default function InlineInput({
  defaultValue = '',
  selectNameOnly = false,
  onSubmit,
  onCancel,
  placeholder,
}: InlineInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    input.focus();

    if (selectNameOnly && defaultValue.includes('.')) {
      const dotIndex = defaultValue.lastIndexOf('.');
      input.setSelectionRange(0, dotIndex);
    } else {
      input.select();
    }
  }, [defaultValue, selectNameOnly]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = value.trim();
      if (trimmed) {
        onSubmit(trimmed);
      } else {
        onCancel();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const handleBlur = () => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== defaultValue) {
      onSubmit(trimmed);
    } else {
      onCancel();
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      placeholder={placeholder}
      className="h-6 w-full px-1.5 text-xs bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--accent)] rounded outline-none"
    />
  );
}
