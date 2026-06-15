# CutLab — Build Process & Prompt Log

> This document is the authoritative summary for the CutLab assignment. It records **how CutLab was built** (the prompts and the AI-assisted workflow used in Cursor), and it maps the assignment requirements to the actual implementation. The default `README.md` is the Vite template; **this file is the real project document.**

CutLab is a browser-based media editor: upload **video, audio, and image** media, arrange them on a **custom multi-track timeline**, edit them (crop, reverse, speed, trim, keyframe zoom/pan, padding, audio), and **preview** the composition in real time with the Remotion Player. It also supports **in-browser MP4 export**.

---

## 1. How it was built (Cursor workflow)

CutLab was built entirely in **Cursor** using a deliberate, repeatable loop:

1. **Describe the goal** in plain language (often with a screenshot or a reference editor like VEED / Clideo).
2. **Generate a scoped plan + todos** for that goal (Cursor Plan mode).
3. **Execute** with the instruction: *"Implement the plan as specified … mark todos in_progress as you work … don't stop until all todos are complete."*
4. **QA the result** (run the dev server, click through, attach a screenshot of anything wrong).
5. **Refine** with a short corrective prompt and repeat.

Two characteristics define the whole history:

- **Screenshot-driven iteration** — most UI fixes were triggered by a screenshot of the exact problem ("video coming cropped", "toggle bug", "blank after split", "reverse blinking").
- **Reference-driven design** — the UI was shaped against real editors (VEED, Clideo) the reviewer-style brief implied.

This is why the prompt history below alternates between **feature plans**, **bug reports with screenshots**, and **clarifying questions about the brief** ("is cropping the same as split?", "reverse just means a toggle, right?").

---

## 2. How to get the raw Cursor chat history (optional attachment)

If the reviewer wants the **unedited** chat alongside this curated log:

- In Cursor, open the relevant chat in the chat panel.
- Use the chat's overflow menu (the `…` at the top of the conversation) → **Export Chat** (exports the conversation as Markdown).
- Alternatively, **right-click the chat tab → Export**, or copy individual messages.

The curated, phase-grouped version in Section 3 is easier to read; the verbatim prompts are preserved in the Appendix.

---

## 3. Build timeline — prompt log (phase by phase)

Each phase lists the **intent** (what was asked) and the **outcome** (what shipped). Representative prompts are quoted; the full verbatim list is in the Appendix.

### Phase 0 — Bootstrap
- *"make a react+vite app, make it here right now, don't create a separate folder"* → React 19 + Vite 8 + TypeScript scaffolded directly in the repo root.
- *"clear all unnecessary code / unused files"* → stripped the Vite boilerplate down to a clean base.

### Phase 1 — Assignment intake & scope
- Pasted the full brief (image/video/audio operations + Remotion Player suggestion).
- *"support image, video and audio upload and all related functionality; give a functionality list in the build."*
- *"make UI in dark mode, beautiful; use Redux and Tailwind CSS."*
- **Outcome:** locked the stack (Redux Toolkit + Tailwind v4 + Remotion) and the dark-mode design language.

### Phase 2 — Core editor
- Plan executions that built the four panels: **Media Library**, **Preview (Remotion Player)**, **Timeline**, and **Inspector**, backed by three Redux slices (`project`, `media`, `editor`).
- **Outcome:** upload → clip on timeline → live preview working end-to-end.

### Phase 3 — Preview fit & QA
- *"video is coming cropped, make it take full width/height."*
- *"in number input, remove the default spinner buttons."*
- *"on input click the caret jumps to the first character — fix it."*
- **Outcome:** correct `object-fit` composition sizing; custom numeric inputs; caret behavior fixed.

### Phase 4 — Export & UI component library
- *"give an edited download option."*
- *"make the toggle a single reusable component; create a Component folder and put shared components there."*
- **Outcome:** in-browser MP4 **export** via `@remotion/web-renderer`; reusable `Toggle`, `NumberInput`, `Slider`, `FieldRow`, etc.

### Phase 5 — VEED/Clideo-inspired UI + dnd-kit
- *"take inspiration from this editor; make the left and bottom UI like it."*
- *"I should be able to drag-drop any clip and create a new track."*
- *"on click of a clip, show a delete button in the top bar; remove the left tab."*
- *"on upload, add the new clip directly to the bottom (timeline)."*
- *"I should NOT be allowed to overlap videos on the same track — many editors don't allow that."*
- **Outcome:** **dnd-kit** clip dragging, drag-to-new-track, frame thumbnails, auto-add-on-upload, and **non-overlapping placement** on a track.

### Phase 6 — Feature verification against the brief
- *"these are the required features [list] — are they all built?"*
- Clarifying exchanges: *"is video cropping the same as split?"*, *"reverse just means a toggle, right?"*, *"what does the static-image-to-video keyframe feature actually do?"*
- **Outcome:** confirmed each brief item maps to a real feature (see Section 5).

### Phase 7 — Bug fixes & polish
- *"after split, the video goes blank"* → fixed clip-split source/trim handoff.
- *"playing at 2x is buffering"* → speed playback smoothing.
- *"reverse play has a blinking issue"* → *"now it's not blinking but buffering — make it super perfect."*
  - **Outcome:** built an **in-memory ImageBitmap frame cache** that pre-decodes a reversed clip once, then plays it back smoothly from memory (preview); export stays frame-accurate via `@remotion/media`.
- Numeric **Trim in/out** fields fixed so they recompute `durationInFrames` (no blank tail; clip shrinks in place).
- Inspector polish: section **dividers**, consistent row spacing, **dark-mode-only** (light mode removed).

### Phase 8 — Code-quality refactors
- *"delete the thunk file — you can do everything with slice/store/dispatch."*
- *"move all types into a global types file and all constants into a global constants file under a utils folder."*
- *"delete `selectors.ts` / `hooks.ts` and inline where used."*
- *"rename `ui` → `UI`, `Main.tsx` → `TimelineComposition.tsx`, `store/index.ts` → `store/store.ts`."*
- **Outcome:** thunk-free Redux, centralized `src/utils/types.ts` + `src/utils/constants.ts`, inlined selectors/dispatch, clearer names.

### Phase 9 — Final polish
- *"make the delete modal bigger/clearer with a darker overlay."*
- *"the 'drop here to add a new track' line should always span the full width; remove the extra gray area."*
- *"make a better logo for CutLab"* (used in header + favicon).
- *"do a quick QA."*
- *"create a `plan.md` summarizing everything"* → this document.

---

## 4. Tech stack

- **React 19** + **TypeScript ~6** + **Vite 8**
- **Remotion 4** — `@remotion/player` (preview), `@remotion/web-renderer` (in-browser MP4 export), `@remotion/media`
- **Redux Toolkit 2** + **react-redux 9** — state, no thunks (slices + inline selectors + direct dispatch)
- **dnd-kit** (`@dnd-kit/core`, `@dnd-kit/modifiers`) — timeline drag & drop
- **Tailwind CSS v4** — styling via design tokens (dark-only)

## How to run

```bash
npm install
npm run dev      # start the dev server (Vite)
npm run build    # type-check (tsc -b) + production build
npm run preview  # preview the production build
npm run lint     # eslint
```

---

## 5. Requirement coverage (brief → implementation)

**Core**

| Requirement | Where it lives |
| --- | --- |
| Upload video / audio / image | `src/components/MediaLibrary/MediaLibrary.tsx`, `createMediaAsset` (`src/utils/media.ts`), `addMediaAsset` (mediaSlice), `addMediaToTimeline` (projectSlice) |
| Arrange on a custom timeline | `src/components/Timeline/Timeline.tsx` (dnd-kit); `moveClip` / `moveClipToNewTrack` |
| Preview with a video player | `src/components/Preview/Preview.tsx` → `@remotion/player` → `src/remotion/TimelineComposition.tsx` |

**Image operations**

| Requirement | Where it lives |
| --- | --- |
| Static image → video (keyframe zoom / pan) | Keyframes on clips; `addKeyframe`/`updateKeyframe`/`removeKeyframe`; `src/components/Inspector/KeyframeRow.tsx`; interpolation in `src/remotion/interpolateKeyframes.ts`; applied in `src/remotion/ClipRenderer.tsx` |
| Image cropping / panning / padding | Inspector Transform (`scale`, `translateX/Y`, `padding`, `paddingColor`, `crop`); `updateClipTransform`; rendered in `ClipRenderer` |

**Video operations**

| Requirement | Where it lives |
| --- | --- |
| Cropping | `transform.crop` (Crop X/Y/W/H, 0–1) → `ClipRenderer` |
| Reverse | `clip.reverse` toggle; smooth preview via `src/remotion/reverseFrameCache.ts` + `src/remotion/ReversedVideo.tsx`; export via `@remotion/media` |
| Speed change | `clip.speed` (presets `0.5 / 1 / 1.5 / 2` + custom); `playbackRate` in `ClipRenderer`; duration recomputed via `durationFromTrim` |
| Trimming | Drag handles (`src/components/Timeline/ClipBlock.tsx` + `computeTrim` in `src/components/Timeline/trim.ts`) and numeric Trim in/out (Inspector) → `trimClip` |
| Clips overlay | Clips on different tracks overlapping in time; paint order in `TimelineComposition` (tracks reversed so the top track renders on top) |
| Stitching | Sequential clips on one track; `resolveNonOverlappingStart` keeps them adjacent/non-overlapping; played back-to-back via Remotion `<Sequence>` |
| Clips stacking | Each add creates a new track (Video 1, Video 2, …); z-stacked layers; drag to the "new track" drop zone |
| Padding | `transform.padding` + `paddingColor` → `ClipRenderer` (letterbox / pillarbox) |

**Beyond the brief (bonus)**

- In-browser **MP4 export** via `renderMediaOnWeb` (`src/utils/export.ts`).
- Per-clip **audio**: mute, volume, fade in / fade out.
- **Keyboard shortcuts** (`src/hooks/useKeyboardShortcuts.ts`).
- **Dynamic composition sizing** from the first added media.
- **Cascading media delete** (removing a media asset removes its timeline clips) with a confirmation modal.

---

## 6. Architecture

### Folder structure (key paths)

```
src/
  components/
    Header/         App header + export button
    MediaLibrary/   Upload + media grid + delete modal
    Preview/        Remotion <Player> wrapper
    Timeline/       Tracks, ruler, clip blocks, dnd-kit, trim
    Inspector/      Per-clip editing (timing, audio, transform, crop, keyframes)
    UI/             Reusable controls (Toggle, NumberInput, Slider, FieldRow, ...)
  remotion/
    TimelineComposition.tsx   Composition root (tracks → sequences)
    ClipRenderer.tsx          Per-clip render (crop, padding, speed, reverse, keyframes)
    interpolateKeyframes.ts   Keyframe → resolved transform
    reverseFrameCache.ts      LRU ImageBitmap cache for smooth reverse
    ReversedVideo.tsx         Canvas playback of cached reverse frames
  store/
    store.ts                  configureStore + RootState / AppDispatch
    slices/                   projectSlice, mediaSlice, editorSlice
  hooks/                      useCompositionProps, useKeyboardShortcuts
  utils/                      types.ts, constants.ts, media.ts, export.ts
  styles/                     theme.config.css (design tokens)
```

### Data flow

```mermaid
flowchart LR
  UI[Media Library / Timeline / Inspector] -->|dispatch| Store[(Redux store\nproject / media / editor)]
  Store -->|useCompositionProps| Comp[TimelineComposition]
  Comp --> Clip[ClipRenderer\ncrop · padding · speed · reverse · keyframes]
  Clip --> Preview[@remotion/player\nlive preview]
  Clip --> Export[@remotion/web-renderer\nMP4 export]
```

---

## 7. Key technical decisions

- **Preview vs export rendering split** — forward preview uses native `HtmlVideo` for smooth `playbackRate`; export uses `@remotion/media` for web-renderer compatibility.
- **Smooth reverse playback** — decoding video frames backward in real time stutters, so a reversed clip is **pre-decoded once** into an LRU `ImageBitmap` cache and drawn to a canvas, giving smooth scrubbing in preview while keeping export frame-accurate.
- **Thunk-free Redux** — slices + `prepare` reducers + inline selectors + direct `dispatch`; cross-cutting actions (e.g. cascading delete) are orchestrated in components.
- **Centralized types & constants** — single `src/utils/types.ts` and `src/utils/constants.ts` for consistency.
- **Non-overlapping placement** — same-track clips can't overlap (matches mainstream editors); overlay is achieved by stacking on separate tracks.

---

## 8. Known limitations & future work

- **Bundle size** from the in-browser encoder (mediabunny) — code-splitting/lazy-loading the export path is a future improvement.
- **Text track** type exists in the model but has no dedicated UI yet.
- **No persistence** — the project is in-memory only (no save/load yet).

---

## Appendix — selected verbatim prompts

Lightly cleaned for readability; ordering preserved. Repeated "Implement the plan as specified…" execution messages are omitted (they mark the execute step of each plan).

- "make a react+vite app make it here right now dont creat room folder spread over"
- "clear all the unnessesary code"
- "clear all non used files and code"
- "[assignment brief pasted: Image_Operations / Video_Operations + Remotion Player suggestion]"
- "see do support image, video and audio upload and related to that provide all related functionality and give functionality list in build"
- "make UI in dark mode and best beautiful way with dark mode and light mode also use redux and tailwind css for css"
- "now according to video and image make it w-full h-full and please run a server… find bugs by doing QA, and in number input remove the default btn which comes, and do a good QA"
- "see the width and height is not full, the video is coming as cropped — fix that, make it take full"
- "now give edited download option and make input toggle btn by single component, make a Component folder, add all components there; there is a toggle bug (see SS); on input click the caret goes to first which I don't want — fix that"
- "and here instead of this show frame in the blue area (see SS)"
- "while playing a video in 2x it's buffering — there is a bug"
- "add cursor pointer to CTAs, on click of drag-and-drop area open the click action CTA, increase text a little, add a logo to CutLab and to the browser tab icon"
- "split not working, and on reverse when run on 1x great buffering issue coming"
- "make the upload section UI/UX like this video; bottom section like this; middle and right stay as is"
- "can you access this website (Clideo editor) and all its features… take inspiration from there UI and make left and bottom UI like it"
- "remove this copy btn"
- "make code so simple readable, and yes if you think you need, you can restructure the folder structure"
- "I should not be allowed to overlap videos — many editors don't give that feature"
- "on upload a new video directly add it to bottom"
- "remove this left side tab; I should be able to drag-drop any clip and create a new area; on click of a clip a delete btn should come in the top bar"
- "[feature list] — are these all built?"
- "static image to video keyframe-wise — any other area where this is provided? I'm not able to understand what this is doing"
- "is video cropping the same as split?"
- "Reverse — this means just the toggle, right?"
- "there is a bug: after split the video is blank"
- "on reverse play there is a blinking issue, not working perfectly"
- "now it's not blinking but buffering, not running smoothly — make it super perfect"
- "fix the Inspector Trim in/out fields (blank tail; clip shifting)"
- "add dividers between Inspector sections; make spacing consistent"
- "make dark mode default and permanent; remove light mode and its toggle"
- "delete the thunk file — I think you can do all features normally with redux, slice and store"
- "make the delete modal a little better — text is too small and the blur isn't good"
- "move all types into a global types file and all constants into a global constants file; create a utils folder with type and constant files"
- "make UI not ui"
- "delete selectors.ts and add wherever it is used"
- "Main.tsx — rename it per its use"
- "delete hooks.ts and use where it is used"
- "name store/index.ts as store.ts"
- "all features will work perfectly as before, right?"
- "fix this UI issue: 'drop here new track' line breaking — make it always full"
- "make the line full; that text line and clip area have extra gray area — don't want that, only clip area"
- "just do a quick QA"
- "logo is too bad — can you make it better and best"
- "create a plan.md file summarizing everything we've discussed and built"
