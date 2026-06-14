import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import {
  DndContext,
  PointerSensor,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { createSelector } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../store/store";
import {
  selectClip,
  setPlayheadFrame,
  zoomIn,
  zoomOut,
} from "../../store/slices/editorSlice";
import {
  moveClip,
  moveClipToNewTrack,
  removeClip,
  splitClipAtFrame,
  trimClip,
} from "../../store/slices/projectSlice";
import type { Clip, MediaAsset, Track, TrimState } from "../../utils/types";
import { ScissorsIcon, TrashIcon, ZoomInIcon, ZoomOutIcon } from "../icons";
import { ClipBlock } from "./ClipBlock";
import { buildTicks } from "./ticks";
import { computeTrim } from "./trim";
import {
  MIN_TIMELINE_FRAMES,
  NEW_TRACK_DROP_ID,
  RIGHT_GUTTER_PX,
  RULER_HEIGHT,
  TRACK_HEIGHT,
} from "../../utils/constants";

const selectClips = (state: RootState) => state.project.clips;
const selectTracks = (state: RootState) => state.project.tracks;
const selectFps = (state: RootState) => state.project.fps;
const selectMediaAssets = (state: RootState) => state.media.assets;
const selectPlayheadFrame = (state: RootState) => state.editor.playheadFrame;
const selectPixelsPerFrame = (state: RootState) => state.editor.pixelsPerFrame;
const selectSelectedClipId = (state: RootState) => state.editor.selectedClipId;
const selectProjectDurationInFrames = createSelector(
  [selectClips, selectFps],
  (clips, fps) => {
    const end = Object.values(clips).reduce((max, clip) => {
      return Math.max(max, clip.startFrame + clip.durationInFrames);
    }, 0);
    return Math.max(MIN_TIMELINE_FRAMES, end || fps * 10);
  },
);

function TrackLane({
  track,
  fillWidth,
  onEmptyPointerDown,
  children,
}: {
  track: Track;
  fillWidth: number;
  onEmptyPointerDown: (event: ReactPointerEvent) => void;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: track.id,
    data: { type: track.type },
  });
  return (
    <div
      ref={setNodeRef}
      className={`relative border-b border-border transition-colors ${
        isOver ? "ring-1 ring-inset ring-primary" : ""
      }`}
      style={{ width: "100%", height: TRACK_HEIGHT }}
      onPointerDown={onEmptyPointerDown}
    >
      {/* Gray lane fill spans only the clip area, not the trailing gutter. */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0"
        style={{ width: fillWidth, backgroundColor: "var(--panel-2)" }}
      />
      {children}
    </div>
  );
}

function NewTrackDropZone() {
  const { setNodeRef, isOver } = useDroppable({ id: NEW_TRACK_DROP_ID });
  return (
    <div
      ref={setNodeRef}
      className={`flex items-center justify-center border-b border-dashed text-xxs uppercase tracking-wider transition-colors ${
        isOver
          ? "border-primary bg-primary/10 text-fg"
          : "border-border text-muted-2"
      }`}
      style={{ width: "100%", height: TRACK_HEIGHT }}
    >
      Drop here to add a new track
    </div>
  );
}

export function Timeline() {
  const dispatch = useDispatch<AppDispatch>();
  const tracks = useSelector(selectTracks);
  const clips = useSelector(selectClips);
  const assets = useSelector(selectMediaAssets);
  const fps = useSelector(selectFps);
  const pixelsPerFrame = useSelector(selectPixelsPerFrame);
  const playheadFrame = useSelector(selectPlayheadFrame);
  const selectedClipId = useSelector(selectSelectedClipId);
  const projectDuration = useSelector(selectProjectDurationInFrames);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [trimState, setTrimState] = useState<TrimState | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const mediaRecord = useMemo(() => {
    return assets.reduce<Record<string, MediaAsset>>((record, asset) => {
      record[asset.id] = asset;
      return record;
    }, {});
  }, [assets]);

  const contentWidth = projectDuration * pixelsPerFrame + RIGHT_GUTTER_PX;
  const ticks = useMemo(
    () => buildTicks(projectDuration, fps, pixelsPerFrame),
    [projectDuration, fps, pixelsPerFrame],
  );

  const selectedClip = selectedClipId ? clips[selectedClipId] : undefined;
  const canSplit =
    !!selectedClip &&
    playheadFrame > selectedClip.startFrame &&
    playheadFrame < selectedClip.startFrame + selectedClip.durationInFrames;

  function handleSplit() {
    if (!selectedClip || !canSplit) return;
    dispatch(
      splitClipAtFrame({ clipId: selectedClip.id, frame: playheadFrame }),
    );
  }

  function handleDelete() {
    if (!selectedClip) return;
    dispatch(removeClip(selectedClip.id));
    dispatch(selectClip(null));
  }

  function handleDragStart(event: DragStartEvent) {
    dispatch(selectClip(String(event.active.id)));
  }

  function handleDragEnd(event: DragEndEvent) {
    const clipId = String(event.active.id);
    const clip = clips[clipId];
    if (!clip) return;
    const deltaFrames = Math.round(event.delta.x / pixelsPerFrame);
    const startFrame = Math.max(0, clip.startFrame + deltaFrames);
    const overId = event.over ? String(event.over.id) : undefined;

    if (overId === NEW_TRACK_DROP_ID) {
      dispatch(moveClipToNewTrack({ clipId, startFrame }));
      dispatch(selectClip(clipId));
      return;
    }

    const trackId = overId && overId !== clip.trackId ? overId : undefined;
    dispatch(moveClip({ clipId, startFrame, trackId }));
  }

  function frameFromClientX(clientX: number): number {
    const container = scrollRef.current;
    if (!container) return 0;
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left + container.scrollLeft;
    return Math.max(0, Math.round(x / pixelsPerFrame));
  }

  function handleRulerPointerDown(event: ReactPointerEvent) {
    dispatch(setPlayheadFrame(frameFromClientX(event.clientX)));
    const move = (moveEvent: PointerEvent) => {
      dispatch(setPlayheadFrame(frameFromClientX(moveEvent.clientX)));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function neighbourBounds(clip: Clip) {
    const track = tracks.find((item) => item.id === clip.trackId);
    const clipEnd = clip.startFrame + clip.durationInFrames;
    let minStartFrame = 0;
    let maxEndFrame = Number.MAX_SAFE_INTEGER;
    for (const id of track?.clipIds ?? []) {
      if (id === clip.id) continue;
      const other = clips[id];
      if (!other) continue;
      const otherEnd = other.startFrame + other.durationInFrames;
      if (otherEnd <= clip.startFrame) {
        minStartFrame = Math.max(minStartFrame, otherEnd);
      } else if (other.startFrame >= clipEnd) {
        maxEndFrame = Math.min(maxEndFrame, other.startFrame);
      }
    }
    return { minStartFrame, maxEndFrame };
  }

  function beginTrim(
    event: ReactPointerEvent,
    clip: Clip,
    edge: "left" | "right",
  ) {
    const media = mediaRecord[clip.mediaId];
    const { minStartFrame, maxEndFrame } = neighbourBounds(clip);
    setTrimState({
      edge,
      clipId: clip.id,
      startClientX: event.clientX,
      originStartFrame: clip.startFrame,
      originDuration: clip.durationInFrames,
      originTrimStart: clip.trimStartFrame,
      originTrimEnd: clip.trimEndFrame,
      speed: clip.speed,
      sourceFrames: media ? Math.floor(media.naturalDurationSeconds * fps) : 0,
      type: clip.type,
      minStartFrame,
      maxEndFrame,
    });
  }

  useEffect(() => {
    if (!trimState) return;

    function handlePointerMove(event: PointerEvent) {
      if (!trimState) return;
      const deltaFrames = Math.round(
        (event.clientX - trimState.startClientX) / pixelsPerFrame,
      );
      const bounds = computeTrim({
        edge: trimState.edge,
        deltaFrames,
        originStartFrame: trimState.originStartFrame,
        originDuration: trimState.originDuration,
        originTrimStart: trimState.originTrimStart,
        originTrimEnd: trimState.originTrimEnd,
        speed: trimState.speed,
        sourceFrames: trimState.sourceFrames,
        type: trimState.type,
        minStartFrame: trimState.minStartFrame,
        maxEndFrame: trimState.maxEndFrame,
      });
      dispatch(trimClip({ clipId: trimState.clipId, ...bounds }));
    }

    function handlePointerUp() {
      setTrimState(null);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [trimState, pixelsPerFrame, dispatch]);

  return (
    <section className="flex h-72 shrink-0 flex-col border-t border-border bg-panel">
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-border px-3">
        <span className="text-sm font-semibold uppercase tracking-wider text-muted">
          Timeline
        </span>
        <div className="flex items-center gap-2">
          {selectedClip && (
            <button
              type="button"
              onClick={handleDelete}
              title="Delete clip (Del)"
              className="flex h-7 items-center gap-1.5 rounded border border-border bg-panel-2 px-2.5 text-xs font-medium text-fg transition-colors hover:border-danger hover:text-danger"
            >
              <TrashIcon width={13} height={13} />
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={handleSplit}
            disabled={!canSplit}
            title="Split clip at playhead (S)"
            className="flex h-7 items-center gap-1.5 rounded border border-border bg-panel-2 px-2.5 text-xs font-medium text-fg transition-colors hover:border-border-strong hover:bg-panel-3 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ScissorsIcon width={13} height={13} />
            Split
          </button>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => dispatch(zoomOut())}
              className="flex h-7 w-7 items-center justify-center rounded border border-border bg-panel-2 text-muted transition-colors hover:text-fg"
              aria-label="Zoom out"
            >
              <ZoomOutIcon width={14} height={14} />
            </button>
            <button
              type="button"
              onClick={() => dispatch(zoomIn())}
              className="flex h-7 w-7 items-center justify-center rounded border border-border bg-panel-2 text-muted transition-colors hover:text-fg"
              aria-label="Zoom in"
            >
              <ZoomInIcon width={14} height={14} />
            </button>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-auto">
        <div style={{ width: contentWidth, minWidth: "100%" }}>
          {/* Ruler */}
          <div className="sticky top-0 z-20" style={{ height: RULER_HEIGHT }}>
            <div
              className="relative cursor-text border-b border-border bg-panel"
              style={{ width: "100%", height: RULER_HEIGHT }}
              onPointerDown={handleRulerPointerDown}
            >
              {ticks.map((tick) => (
                <div
                  key={tick.frame}
                  className="absolute top-0 flex h-full items-center"
                  style={{ left: tick.frame * pixelsPerFrame }}
                >
                  <div className="h-2 w-px bg-border-strong" />
                  <span className="ml-1 text-xxs text-muted-2">
                    {tick.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tracks */}
          {tracks.length === 0 ? (
            <div
              className="flex items-center justify-center text-sm text-muted-2"
              style={{ height: TRACK_HEIGHT * 2 }}
            >
              Add media from the library to create tracks.
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={pointerWithin}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              {tracks.map((track) => (
                <TrackLane
                  key={track.id}
                  track={track}
                  fillWidth={projectDuration * pixelsPerFrame}
                  onEmptyPointerDown={(event) => {
                    if (event.target === event.currentTarget) {
                      dispatch(selectClip(null));
                    }
                  }}
                >
                  {track.clipIds.map((clipId) => {
                    const clip = clips[clipId];
                    if (!clip) return null;
                    return (
                      <ClipBlock
                        key={clip.id}
                        clip={clip}
                        media={mediaRecord[clip.mediaId]}
                        pixelsPerFrame={pixelsPerFrame}
                        isSelected={clip.id === selectedClipId}
                        onSelect={(id) => dispatch(selectClip(id))}
                        onTrimStart={beginTrim}
                      />
                    );
                  })}
                </TrackLane>
              ))}
              <NewTrackDropZone />
            </DndContext>
          )}

          {/* Playhead */}
          <div
            className="pointer-events-none absolute top-0 z-30 w-px"
            style={{
              left: playheadFrame * pixelsPerFrame,
              height: "100%",
              backgroundColor: "var(--playhead)",
            }}
          >
            <div
              className="absolute -left-1 top-0 h-2 w-2 rounded-full"
              style={{ backgroundColor: "var(--playhead)" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
