import * as React from "react";
import { X, ZoomIn, ZoomOut, Check } from "lucide-react";
import { Button } from "./Button";

// ---------------------------------------------------------------------------
// ImageCropModal — Telegram-style image crop
// Drag image to position inside a fixed crop frame, scroll to zoom.
// On confirm: exports a 1920×? JPEG blob.
// ---------------------------------------------------------------------------

const CONTAINER_W = 600;
const CONTAINER_H = 380;
const PAD = 30;

interface Props {
  file: File;
  /** width / height ratio, default 16/9 */
  aspectRatio?: number;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}

export function ImageCropModal({ file, aspectRatio = 16 / 9, onConfirm, onCancel }: Props) {
  // Stable object URL for the file
  const [objectUrl] = React.useState(() => URL.createObjectURL(file));
  React.useEffect(() => () => URL.revokeObjectURL(objectUrl), [objectUrl]);

  // Natural image dimensions (set once when <img> loads)
  const [nat, setNat] = React.useState({ w: 0, h: 0 });

  // Crop box (computed from container + aspect ratio + padding)
  const maxCropW = CONTAINER_W - PAD * 2;
  const maxCropH = CONTAINER_H - PAD * 2;
  const CROP_W = Math.min(maxCropW, maxCropH * aspectRatio);
  const CROP_H = CROP_W / aspectRatio;
  const CROP_X = (CONTAINER_W - CROP_W) / 2;
  const CROP_Y = (CONTAINER_H - CROP_H) / 2;

  // Minimum scale so the image always fills the crop box completely
  const minScale = React.useMemo(
    () => (nat.w && nat.h ? Math.max(CROP_W / nat.w, CROP_H / nat.h) : 1),
    [nat, CROP_W, CROP_H]
  );

  const [scale, setScale] = React.useState(1);
  // offset = where the center of the image sits inside the container
  const [offset, setOffset] = React.useState({ x: CONTAINER_W / 2, y: CONTAINER_H / 2 });
  const dragRef = React.useRef<{ sx: number; sy: number; sox: number; soy: number } | null>(null);
  const [cropping, setCropping] = React.useState(false);

  // Keep offset within bounds so crop box stays covered by the image
  const clamp = React.useCallback(
    (ox: number, oy: number, s: number) => {
      if (!nat.w || !nat.h) return { x: ox, y: oy };
      const hw = (nat.w * s) / 2;
      const hh = (nat.h * s) / 2;
      return {
        x: Math.min(CROP_X + hw, Math.max(CROP_X + CROP_W - hw, ox)),
        y: Math.min(CROP_Y + hh, Math.max(CROP_Y + CROP_H - hh, oy)),
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nat, CROP_X, CROP_Y, CROP_W, CROP_H]
  );

  const onImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
    setNat({ w, h });
    const s = Math.max(CROP_W / w, CROP_H / h);
    setScale(s);
    setOffset({ x: CONTAINER_W / 2, y: CONTAINER_H / 2 });
  };

  // ── Drag ──────────────────────────────────────────────────────────────────
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { sx: e.clientX, sy: e.clientY, sox: offset.x, soy: offset.y };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    setOffset(
      clamp(
        dragRef.current.sox + (e.clientX - dragRef.current.sx),
        dragRef.current.soy + (e.clientY - dragRef.current.sy),
        scale
      )
    );
  };
  const onPointerUp = () => { dragRef.current = null; };

  // ── Zoom ──────────────────────────────────────────────────────────────────
  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const next = Math.min(5, Math.max(minScale, scale * (e.deltaY < 0 ? 1.1 : 0.9)));
    setScale(next);
    setOffset(o => clamp(o.x, o.y, next));
  };
  const zoom = (factor: number) => {
    const next = Math.min(5, Math.max(minScale, scale * factor));
    setScale(next);
    setOffset(o => clamp(o.x, o.y, next));
  };

  // ── Export ────────────────────────────────────────────────────────────────
  const handleCrop = async () => {
    if (!nat.w || !nat.h) return;
    setCropping(true);
    try {
      const OUT_W = 1920;
      const OUT_H = Math.round(OUT_W / aspectRatio);
      const canvas = document.createElement("canvas");
      canvas.width = OUT_W;
      canvas.height = OUT_H;
      const ctx = canvas.getContext("2d")!;

      const imgLeft = offset.x - (nat.w * scale) / 2;
      const imgTop = offset.y - (nat.h * scale) / 2;
      const srcX = (CROP_X - imgLeft) / scale;
      const srcY = (CROP_Y - imgTop) / scale;
      const srcW = CROP_W / scale;
      const srcH = CROP_H / scale;

      const img = new Image();
      img.src = objectUrl;
      await new Promise<void>(res => { img.onload = () => res(); });
      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, OUT_W, OUT_H);

      canvas.toBlob(blob => { if (blob) onConfirm(blob); }, "image/jpeg", 0.92);
    } finally {
      setCropping(false);
    }
  };

  // ── SVG overlay coords ─────────────────────────────────────────────────
  const L = 18; // corner handle length

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0d0f17] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-white">Обрезать изображение</p>
            <p className="mt-0.5 text-xs text-white/40">
              Перетащите · прокрутите для масштабирования
            </p>
          </div>
          <button
            onClick={onCancel}
            className="grid h-8 w-8 place-items-center rounded-xl text-white/40 transition hover:bg-white/[0.06] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Crop canvas */}
        <div
          className="relative select-none overflow-hidden touch-none"
          style={{ width: CONTAINER_W, height: CONTAINER_H, background: "#0a0b10", cursor: "grab" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onWheel={onWheel}
        >
          {/* Hidden img for dimension detection */}
          <img src={objectUrl} onLoad={onImgLoad} className="hidden" alt="" />

          {/* Visible image */}
          {nat.w > 0 && (
            <img
              src={objectUrl}
              alt=""
              draggable={false}
              style={{
                position: "absolute",
                width: nat.w * scale,
                height: nat.h * scale,
                left: offset.x - (nat.w * scale) / 2,
                top: offset.y - (nat.h * scale) / 2,
                pointerEvents: "none",
                userSelect: "none",
              }}
            />
          )}

          {/* Dark overlay + crop frame */}
          <svg
            className="pointer-events-none absolute inset-0"
            width={CONTAINER_W}
            height={CONTAINER_H}
          >
            {/* Dark areas outside crop */}
            <rect x={0} y={0} width={CONTAINER_W} height={CROP_Y} fill="rgba(0,0,0,0.65)" />
            <rect x={0} y={CROP_Y + CROP_H} width={CONTAINER_W} height={CONTAINER_H - CROP_Y - CROP_H} fill="rgba(0,0,0,0.65)" />
            <rect x={0} y={CROP_Y} width={CROP_X} height={CROP_H} fill="rgba(0,0,0,0.65)" />
            <rect x={CROP_X + CROP_W} y={CROP_Y} width={CONTAINER_W - CROP_X - CROP_W} height={CROP_H} fill="rgba(0,0,0,0.65)" />

            {/* Crop border */}
            <rect x={CROP_X} y={CROP_Y} width={CROP_W} height={CROP_H} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={1.5} />

            {/* Rule of thirds */}
            {[1 / 3, 2 / 3].map((f, i) => (
              <React.Fragment key={i}>
                <line x1={CROP_X + CROP_W * f} y1={CROP_Y} x2={CROP_X + CROP_W * f} y2={CROP_Y + CROP_H} stroke="white" strokeWidth={0.5} strokeOpacity={0.25} />
                <line x1={CROP_X} y1={CROP_Y + CROP_H * f} x2={CROP_X + CROP_W} y2={CROP_Y + CROP_H * f} stroke="white" strokeWidth={0.5} strokeOpacity={0.25} />
              </React.Fragment>
            ))}

            {/* Corner handles */}
            {/* top-left */}
            <line x1={CROP_X} y1={CROP_Y + L} x2={CROP_X} y2={CROP_Y} stroke="white" strokeWidth={2.5} strokeLinecap="round" />
            <line x1={CROP_X} y1={CROP_Y} x2={CROP_X + L} y2={CROP_Y} stroke="white" strokeWidth={2.5} strokeLinecap="round" />
            {/* top-right */}
            <line x1={CROP_X + CROP_W} y1={CROP_Y + L} x2={CROP_X + CROP_W} y2={CROP_Y} stroke="white" strokeWidth={2.5} strokeLinecap="round" />
            <line x1={CROP_X + CROP_W - L} y1={CROP_Y} x2={CROP_X + CROP_W} y2={CROP_Y} stroke="white" strokeWidth={2.5} strokeLinecap="round" />
            {/* bottom-left */}
            <line x1={CROP_X} y1={CROP_Y + CROP_H - L} x2={CROP_X} y2={CROP_Y + CROP_H} stroke="white" strokeWidth={2.5} strokeLinecap="round" />
            <line x1={CROP_X} y1={CROP_Y + CROP_H} x2={CROP_X + L} y2={CROP_Y + CROP_H} stroke="white" strokeWidth={2.5} strokeLinecap="round" />
            {/* bottom-right */}
            <line x1={CROP_X + CROP_W} y1={CROP_Y + CROP_H - L} x2={CROP_X + CROP_W} y2={CROP_Y + CROP_H} stroke="white" strokeWidth={2.5} strokeLinecap="round" />
            <line x1={CROP_X + CROP_W - L} y1={CROP_Y + CROP_H} x2={CROP_X + CROP_W} y2={CROP_Y + CROP_H} stroke="white" strokeWidth={2.5} strokeLinecap="round" />
          </svg>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/[0.07] px-5 py-4">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => zoom(0.85)}
              className="grid h-8 w-8 place-items-center rounded-xl text-white/40 transition hover:bg-white/[0.06] hover:text-white"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              onClick={() => zoom(1.15)}
              className="grid h-8 w-8 place-items-center rounded-xl text-white/40 transition hover:bg-white/[0.06] hover:text-white"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <span className="ml-1 text-xs text-white/25">{Math.round(scale * 100)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="glass" size="sm" onClick={onCancel}>
              Отмена
            </Button>
            <Button size="sm" loading={cropping} onClick={handleCrop}>
              <Check className="h-3.5 w-3.5" /> Применить
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
