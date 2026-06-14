import { useEffect, useRef, useState } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { Clip, MediaAsset } from "../types";
import { getReversedFrames } from "./reverseFrameCache";

interface ReversedVideoProps {
  clip: Clip;
  media: MediaAsset;
  style: React.CSSProperties;
}

const overlayStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "rgba(0, 0, 0, 0.55)",
  color: "#ffffff",
  fontSize: "3rem",
  letterSpacing: "0.02em",
};

/**
 * Preview-only renderer for reversed video clips. It draws pre-decoded frames
 * from the in-memory cache so reverse playback stays smooth (no per-frame
 * decode). A canvas ref is required to paint each frame.
 */
export function ReversedVideo({ clip, media, style }: ReversedVideoProps) {
  const localFrame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [frames, setFrames] = useState<ImageBitmap[] | null>(null);

  const sourceFrames = Math.max(
    1,
    Math.floor(media.naturalDurationSeconds * fps),
  );

  useEffect(() => {
    let active = true;
    getReversedFrames({
      mediaId: media.id,
      mediaUrl: media.objectUrl,
      trimStartFrame: clip.trimStartFrame,
      trimEndFrame: clip.trimEndFrame,
      speed: clip.speed,
      durationInFrames: clip.durationInFrames,
      sourceFrames,
      fps,
      sourceWidth: media.width,
      sourceHeight: media.height,
    })
      .then((result) => {
        if (active) setFrames(result);
      })
      .catch(() => {
        if (active) setFrames([]);
      });
    return () => {
      active = false;
    };
  }, [
    media.id,
    media.objectUrl,
    media.width,
    media.height,
    clip.trimStartFrame,
    clip.trimEndFrame,
    clip.speed,
    clip.durationInFrames,
    sourceFrames,
    fps,
  ]);

  useEffect(() => {
    if (!frames || frames.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const index = Math.max(0, Math.min(frames.length - 1, localFrame));
    const bitmap = frames[index];
    if (!bitmap) return;
    if (canvas.width !== bitmap.width || canvas.height !== bitmap.height) {
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(bitmap, 0, 0);
  }, [frames, localFrame]);

  return (
    <>
      <canvas ref={canvasRef} style={{ ...style, objectFit: "cover" }} />
      {frames === null && <div style={overlayStyle}>Preparing reverse...</div>}
    </>
  );
}
