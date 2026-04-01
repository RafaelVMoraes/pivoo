interface HighlightOverlayProps {
  rect: DOMRect;
}

export const HighlightOverlay = ({ rect }: HighlightOverlayProps) => {
  const padding = 8;

  return (
    <>
      <div className="fixed inset-0 bg-black/55 z-[100] pointer-events-auto" aria-hidden="true" />
      <div
        className="fixed z-[101] rounded-xl ring-2 ring-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] pointer-events-none"
        style={{
          top: rect.top - padding,
          left: rect.left - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
        }}
        aria-hidden="true"
      />
    </>
  );
};
