/** The handful of line icons riskboard needs, drawn at one 1.5px stroke. */
const PATHS = {
  close: 'M5 5l10 10M15 5L5 15',
  plus: 'M10 4v12M4 10h12',
  scale: 'M3 10h14M6 6l-3 4 3 4M14 6l3 4-3 4',
} as const;

export function Icon({ name, label }: { name: keyof typeof PATHS; label?: string }) {
  return (
    <svg className="icon" viewBox="0 0 20 20" width="16" height="16" aria-hidden={label ? undefined : true} role={label ? 'img' : undefined} aria-label={label}>
      <path d={PATHS[name]} />
    </svg>
  );
}
