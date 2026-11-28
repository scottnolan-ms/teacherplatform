import type { CSSProperties } from 'react';
import './difficulty-chip.css';

export function DifficultyChip({ level, percent, style }: { level: string; percent?: number; style?: CSSProperties }) {
  const tone = level.toLowerCase();
  const icon = ['refresher', 'easy', 'medium', 'hard'].includes(tone);
  const distribution = percent !== undefined;
  return <span className="ds-difficulty-chip" data-level={tone} title={distribution ? level : undefined}
    role={distribution ? 'img' : undefined} aria-label={distribution ? `${level} ${percent}%` : undefined} style={style}>
    {icon && (distribution
      ? <i aria-hidden="true" className="ds-difficulty-bars" style={{ maskImage: `url(/assets/design-system/difficulty-bars-${tone}.svg)` }}/>
      : <i aria-hidden="true" className="ds-difficulty-peaks" style={{
        '--difficulty-peak': `url(/assets/design-system/difficulty-peaks-${tone}.svg)`,
        '--difficulty-snow': tone === 'refresher' ? 'none' : `url(/assets/design-system/difficulty-peaks-${tone}-snow.svg)`,
      } as CSSProperties}/>)}
    <span>{distribution ? `${percent}%` : level}</span>
  </span>;
}
