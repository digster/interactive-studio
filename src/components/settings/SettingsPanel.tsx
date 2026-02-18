import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Minus, Plus } from 'lucide-react';
import { useSettingsStore, type Theme } from '../../store/settingsStore';
import clsx from 'clsx';

interface SettingsPanelProps {
  onClose: () => void;
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-lg bg-[var(--bg-primary)] p-0.5 border border-[var(--border)]">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={clsx(
            'px-3 py-1 text-xs font-medium rounded-md transition-all duration-150',
            value === opt.value
              ? 'bg-[var(--accent)] text-white shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function ToggleSwitch({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={clsx(
        'relative w-9 h-5 rounded-full transition-colors duration-200',
        enabled ? 'bg-[var(--accent)]' : 'bg-[var(--border)]',
      )}
    >
      <div
        className={clsx(
          'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200',
          enabled ? 'translate-x-4' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <div className="text-sm font-medium text-[var(--text-primary)]">{label}</div>
        {description && (
          <div className="text-xs text-[var(--text-muted)] mt-0.5">{description}</div>
        )}
      </div>
      <div className="shrink-0 ml-4">{children}</div>
    </div>
  );
}

export default function SettingsPanel({ onClose }: SettingsPanelProps) {
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const fontSize = useSettingsStore((s) => s.fontSize);
  const setFontSize = useSettingsStore((s) => s.setFontSize);
  const tabSize = useSettingsStore((s) => s.tabSize);
  const setTabSize = useSettingsStore((s) => s.setTabSize);
  const wordWrap = useSettingsStore((s) => s.wordWrap);
  const setWordWrap = useSettingsStore((s) => s.setWordWrap);
  const minimap = useSettingsStore((s) => s.minimap);
  const setMinimap = useSettingsStore((s) => s.setMinimap);
  const autoSave = useSettingsStore((s) => s.autoSave);
  const setAutoSave = useSettingsStore((s) => s.setAutoSave);
  const autoSaveDelay = useSettingsStore((s) => s.autoSaveDelay);
  const setAutoSaveDelay = useSettingsStore((s) => s.setAutoSaveDelay);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-[480px] max-h-[80vh] bg-[var(--bg-secondary)] rounded-xl shadow-2xl border border-[var(--border)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Settings</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors duration-150"
            aria-label="Close settings"
          >
            <X size={16} />
          </button>
        </div>

        {/* Settings Content */}
        <div className="flex-1 overflow-y-auto px-5 py-2 divide-y divide-[var(--border)]">
          {/* Appearance */}
          <SettingRow label="Theme" description="Choose your preferred color scheme">
            <SegmentedControl
              options={[
                { label: 'Light', value: 'light' as Theme },
                { label: 'Dark', value: 'dark' as Theme },
                { label: 'System', value: 'system' as Theme },
              ]}
              value={theme}
              onChange={setTheme}
            />
          </SettingRow>

          {/* Font Size */}
          <SettingRow label="Font Size" description="Editor font size in pixels">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFontSize(Math.max(10, fontSize - 1))}
                className="p-1 rounded hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors duration-150"
                aria-label="Decrease font size"
              >
                <Minus size={14} />
              </button>
              <span className="w-8 text-center text-xs font-mono text-[var(--text-primary)]">
                {fontSize}
              </span>
              <button
                onClick={() => setFontSize(Math.min(24, fontSize + 1))}
                className="p-1 rounded hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors duration-150"
                aria-label="Increase font size"
              >
                <Plus size={14} />
              </button>
            </div>
          </SettingRow>

          {/* Tab Size */}
          <SettingRow label="Tab Size" description="Number of spaces per tab">
            <SegmentedControl
              options={[
                { label: '2', value: '2' },
                { label: '4', value: '4' },
              ]}
              value={String(tabSize)}
              onChange={(v) => setTabSize(Number(v))}
            />
          </SettingRow>

          {/* Word Wrap */}
          <SettingRow label="Word Wrap" description="Wrap long lines in the editor">
            <ToggleSwitch enabled={wordWrap} onChange={setWordWrap} />
          </SettingRow>

          {/* Minimap */}
          <SettingRow label="Minimap" description="Show code minimap overview">
            <ToggleSwitch enabled={minimap} onChange={setMinimap} />
          </SettingRow>

          {/* Auto Save */}
          <SettingRow label="Auto Save" description="Automatically save files after editing">
            <ToggleSwitch enabled={autoSave} onChange={setAutoSave} />
          </SettingRow>

          {/* Auto Save Delay */}
          {autoSave && (
            <SettingRow label="Auto Save Delay" description="Delay before auto-saving (ms)">
              <input
                type="number"
                min={500}
                max={5000}
                step={100}
                value={autoSaveDelay}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val >= 500 && val <= 5000) {
                    setAutoSaveDelay(val);
                  }
                }}
                className="w-20 px-2 py-1 text-xs font-mono text-[var(--text-primary)] bg-[var(--bg-primary)] border border-[var(--border)] rounded-md outline-none focus:border-[var(--accent)] transition-colors"
              />
            </SettingRow>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
