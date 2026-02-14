interface FoundationPreviewProps {
  foundation: string;
}

export const FoundationPreview = ({ foundation }: FoundationPreviewProps) => {
  const parts = foundation.split('x').map(Number);
  if (parts.length !== 2 || parts.some(isNaN)) return null;
  const [width, height] = parts;

  return (
    <div className="inline-grid gap-0.5" style={{ gridTemplateColumns: `repeat(${width}, 20px)` }}>
      {Array(width * height)
        .fill(0)
        .map((_, i) => (
          <div
            key={i}
            className="w-5 h-5 rounded-[2px] bg-mutant-green/20 border border-mutant-green/50"
          />
        ))}
    </div>
  );
};
