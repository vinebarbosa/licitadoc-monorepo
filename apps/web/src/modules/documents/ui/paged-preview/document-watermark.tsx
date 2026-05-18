type DocumentWatermarkProps = {
  label?: string;
};

export function DocumentWatermark({ label = "PUREZA" }: DocumentWatermarkProps) {
  return (
    <div className="paged-paper-watermark" aria-hidden="true">
      {label}
    </div>
  );
}
