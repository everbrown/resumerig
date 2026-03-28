const PivotPitch = ({ pitch }: { pitch: string }) => (
  <div className="relative rounded-xl p-6 overflow-hidden" style={{ background: 'var(--gradient-hero)' }}>
    <div className="absolute inset-0 opacity-10" style={{ background: 'var(--gradient-accent)' }} />
    <blockquote className="relative font-display text-lg italic leading-relaxed text-primary-foreground">
      "{pitch}"
    </blockquote>
  </div>
);

export default PivotPitch;
