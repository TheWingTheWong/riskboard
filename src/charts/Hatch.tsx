/**
 * Fine-line engraving patterns. riskboard draws anything "beyond the
 * threshold" (the loss tail, hedging contributions) in hatched line, the way
 * security printing renders value, instead of flat fills.
 */
export function HatchDefs({ id, color, spacing = 3, angle = 45, weight = 0.9 }: { id: string; color: string; spacing?: number; angle?: number; weight?: number }) {
  return (
    <defs>
      <pattern id={id} width={spacing} height={spacing} patternUnits="userSpaceOnUse" patternTransform={`rotate(${angle})`}>
        <line x1="0" y1="0" x2="0" y2={spacing} stroke={color} strokeWidth={weight} />
      </pattern>
    </defs>
  );
}
