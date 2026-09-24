# EstateFlow Module Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the 2,307-line `src/App.jsx` into focused modules without changing any behaviour, and stand up a test framework so later work has somewhere to put tests.

**Architecture:** Pure extraction. Each task moves one cohesive group of symbols into a new module, adds imports, and deletes the original lines. Pure functions gain real unit tests as they are extracted — those tests are the safety net proving the move was faithful. Components and screens are verified by build plus manual smoke test, because they are untested today and retrofitting full component tests is out of scope here.

**Tech Stack:** React 19, Vite 7, Tailwind 4, three.js 0.170, Vitest (added in Task 1)

**Spec:** `docs/superpowers/specs/2026-09-23-estateflow-splat-tour-design.md`

## Global Constraints

- **Behaviour must not change.** This plan adds no features and fixes no bugs. Moved code that behaves differently is a defect. Pre-existing bugs stay exactly as they are and are noted, not fixed.
- **`src/App.jsx` ends under 200 lines**, containing only imports, the `App` component, and its state/handlers.
- Node 24.1.0, npm 11.3.0 — already installed.
- ES modules only (`"type": "module"` in `package.json`). Use `import`/`export`, never `require`.
- Existing code style: double-quoted strings, no semicolon-free style, 2-space indent. Match it.
- Every extracted symbol keeps its **exact existing name**. No renaming during a move.
- Tailwind class strings and inline `style` objects move verbatim. A changed class name is a visual regression.
- Import `React` explicitly in every `.jsx` file — this project does not use the automatic JSX runtime import elision anywhere, and files copy the existing pattern from `src/App.jsx:1`.
- One commit per task.

## Baseline

`git log` must show `1d4faa2 Initial commit: EstateFlow as received` as an ancestor. `git diff 1d4faa2 -- src/App.jsx` at the end of this plan shows only deletions plus an import block.

Line numbers below refer to the file **as it exists at the start of the plan**. Because each task deletes lines, work tasks in order and re-locate symbols by name (`grep -n "^function symbolName" src/App.jsx`) rather than trusting the original numbers after Task 2.

---

### Task 1: Test framework

**Files:**
- Modify: `package.json`
- Create: `vitest.config.js`
- Create: `src/lib/__tests__/smoke.test.js`

**Interfaces:**
- Consumes: nothing
- Produces: `npm test` runs Vitest once and exits; `npm run test:watch` watches. All later tasks rely on `npm test`.

- [ ] **Step 1: Install Vitest**

```bash
npm install -D vitest@^3
```

- [ ] **Step 2: Add test scripts to package.json**

In the `"scripts"` block, after `"preview": "vite preview"`, add:

```json
    "test": "vitest run",
    "test:watch": "vitest"
```

Remember the comma after `"preview": "vite preview"`.

- [ ] **Step 3: Create vitest.config.js**

```javascript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.js", "server/**/*.test.js"],
  },
});
```

`environment: "node"` is correct because every test in this plan covers pure
functions. Nothing here needs a DOM.

- [ ] **Step 4: Write a smoke test**

```javascript
import { describe, it, expect } from "vitest";

describe("test framework", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run it**

Run: `npm test`
Expected: PASS, 1 test.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.js src/lib/__tests__/smoke.test.js
git commit -m "test: add Vitest"
```

---

### Task 2: Theme constants

**Files:**
- Create: `src/theme.js`
- Modify: `src/App.jsx` (delete lines 4-19, add import)

**Interfaces:**
- Consumes: nothing
- Produces: `export const C` (colour object), `export const SANS` (string), `export const SERIF` (string). Every later module imports from here.

- [ ] **Step 1: Create src/theme.js**

Copy lines 4-19 of `src/App.jsx` verbatim — the `// ---------- Palette ----------`
comment, the `const C = {...}` object, `const SANS`, and `const SERIF` — into the
new file. Add `export` before each of the three declarations. Change nothing
inside the object.

- [ ] **Step 2: Import into App.jsx**

Add after line 2 (the icons import):

```javascript
import { C, SANS, SERIF } from "./theme.js";
```

- [ ] **Step 3: Delete the originals**

Delete lines 4-19 from `src/App.jsx`.

- [ ] **Step 4: Verify the build**

Run: `npm run build`
Expected: succeeds with no errors. Any "C is not defined" means a line was
deleted that shouldn't have been.

- [ ] **Step 5: Verify visually**

Run `npm run dev`, open the app, confirm the dashboard still renders in the
green/cream palette with serif headings. Stop the server with Ctrl+C.

- [ ] **Step 6: Commit**

```bash
git add src/theme.js src/App.jsx
git commit -m "refactor: extract theme constants to src/theme.js"
```

---

### Task 3: Photo helpers

**Files:**
- Create: `src/lib/photo.js`
- Create: `src/lib/photo.test.js`
- Modify: `src/App.jsx` (remove `fileToImage`, `scorePhoto`, `resizeForApi`, `shrinkForMarble`, `dataUrlToBlob`)

**Interfaces:**
- Consumes: nothing
- Produces:
  - `fileToImage(file: File): Promise<HTMLImageElement>`
  - `scorePhoto(img: HTMLImageElement): number`
  - `resizeForApi(img: HTMLImageElement, maxDim?: number): string` — returns a data URL
  - `shrinkForMarble(dataUrl: string, maxSide?: number): Promise<Blob>`
  - `dataUrlToBlob(dataUrl: string): Blob`

- [ ] **Step 1: Create src/lib/photo.js**

Move these five functions verbatim from `src/App.jsx`, adding `export` to each:

| Function | Original lines |
|---|---|
| `fileToImage` | 22-35 |
| `scorePhoto` | 37-76 |
| `resizeForApi` | 146-157 |
| `shrinkForMarble` | 702-712 |
| `dataUrlToBlob` | 811-818 |

Keep the `// ---------- Helpers ----------` comment at the top of the new file.

- [ ] **Step 2: Write a failing test for dataUrlToBlob**

`dataUrlToBlob` is the one function here that is pure enough to test without a
DOM — it does base64 decoding and MIME parsing. Create `src/lib/photo.test.js`:

```javascript
import { describe, it, expect } from "vitest";
import { dataUrlToBlob } from "./photo.js";

describe("dataUrlToBlob", () => {
  it("decodes base64 payload into a Blob of the right size", () => {
    // "hello" base64-encoded is "aGVsbG8="
    const blob = dataUrlToBlob("data:text/plain;base64,aGVsbG8=");
    expect(blob.size).toBe(5);
  });

  it("reads the MIME type from the data URL", () => {
    const blob = dataUrlToBlob("data:image/png;base64,aGVsbG8=");
    expect(blob.type).toBe("image/png");
  });

  it("falls back to image/jpeg when the MIME type is absent", () => {
    const blob = dataUrlToBlob("data:;base64,aGVsbG8=");
    expect(blob.type).toBe("image/jpeg");
  });
});
```

- [ ] **Step 2b: Run it to confirm it fails**

Run: `npm test src/lib/photo.test.js`
Expected: FAIL — `photo.js` does not exist yet if you did Step 2 before Step 1.
If you did Step 1 first, it should PASS. Either order is fine; the point is to
see the test actually exercise the code rather than silently skip.

- [ ] **Step 3: Import into App.jsx**

```javascript
import { fileToImage, scorePhoto, resizeForApi, shrinkForMarble, dataUrlToBlob } from "./lib/photo.js";
```

- [ ] **Step 4: Delete the originals**

Remove all five function bodies from `src/App.jsx`.

- [ ] **Step 5: Verify**

Run: `npm test && npm run build`
Expected: tests PASS, build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/lib/photo.js src/lib/photo.test.js src/App.jsx
git commit -m "refactor: extract photo helpers with tests"
```

---

### Task 4: Formatters

**Files:**
- Create: `src/lib/format.js`
- Create: `src/lib/format.test.js`
- Modify: `src/App.jsx` (remove `formatPrice`, `formatRoomDimensions`, `validHexColor`)

**Interfaces:**
- Consumes: nothing
- Produces:
  - `formatPrice(price: string | number): string`
  - `formatRoomDimensions(room: object): string`
  - `validHexColor(value: string, fallback?: string): string`

- [ ] **Step 1: Read the three functions before moving them**

Run: `sed -n '78,82p;159,161p;438,444p' src/App.jsx`

Read the actual implementations. The tests below must assert what the code
**does**, not what you assume it does. If the real behaviour differs from the
test expectations written here, **trust the code and fix the test** — this is a
refactor, and preserving current behaviour outranks matching this document.

- [ ] **Step 2: Create src/lib/format.js**

Move `formatPrice` (78-82), `validHexColor` (159-161), and
`formatRoomDimensions` (438-444) verbatim, adding `export` to each.

- [ ] **Step 3: Write tests**

Create `src/lib/format.test.js`:

```javascript
import { describe, it, expect } from "vitest";
import { validHexColor } from "./format.js";

describe("validHexColor", () => {
  it("accepts a six-digit hex colour", () => {
    expect(validHexColor("#AABBCC")).toBe("#AABBCC");
  });

  it("returns the fallback for a malformed value", () => {
    expect(validHexColor("not-a-colour", "#123456")).toBe("#123456");
  });

  it("returns the fallback for an empty value", () => {
    expect(validHexColor("", "#123456")).toBe("#123456");
  });
});
```

Then add a `describe` block for `formatPrice` and one for
`formatRoomDimensions`, asserting the behaviour you read in Step 1. Write at
least two cases each: one ordinary input and one empty/missing input.

- [ ] **Step 4: Run the tests**

Run: `npm test src/lib/format.test.js`
Expected: PASS. A failure means either the test is wrong or the move was not
verbatim — check the move first.

- [ ] **Step 5: Import into App.jsx and delete originals**

```javascript
import { formatPrice, formatRoomDimensions, validHexColor } from "./lib/format.js";
```

- [ ] **Step 6: Verify**

Run: `npm test && npm run build`
Expected: all PASS, build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/lib/format.js src/lib/format.test.js src/App.jsx
git commit -m "refactor: extract formatters with tests"
```

---

### Task 5: Room classification

**Files:**
- Create: `src/lib/rooms.js`
- Create: `src/lib/rooms.test.js`
- Modify: `src/App.jsx` (remove `ROOM_TYPES`, `ROOM_COLORS`, `classifyRoomWithAI`, `normalizeRoomSpecs`)

**Interfaces:**
- Consumes: `resizeForApi` from `./photo.js`, `validHexColor` from `./format.js`
- Produces:
  - `ROOM_TYPES: string[]` — 12 entries, "Bedroom" first, "Other" last
  - `ROOM_COLORS: Record<string, string>`
  - `classifyRoomWithAI(img: HTMLImageElement): Promise<object>`
  - `normalizeRoomSpecs(value: unknown): Array<{name, length, width}>`

- [ ] **Step 1: Create src/lib/rooms.js**

Move `ROOM_TYPES` (116-129), `ROOM_COLORS` (131-144), `classifyRoomWithAI`
(163-216), and `normalizeRoomSpecs` (972-988), adding `export` to each.

`ROOM_COLORS` references `C.forest` and `C.inkSoft`, and `classifyRoomWithAI`
calls `resizeForApi` and `validHexColor`. Add at the top:

```javascript
import { C } from "../theme.js";
import { resizeForApi } from "./photo.js";
import { validHexColor } from "./format.js";
```

- [ ] **Step 2: Read normalizeRoomSpecs before testing it**

Run: `sed -n '972,988p' src/App.jsx`

Note exactly how it coerces `length` and `width`, and what it does with a
non-array input. Your tests assert the real behaviour.

- [ ] **Step 3: Write tests**

Create `src/lib/rooms.test.js`:

```javascript
import { describe, it, expect } from "vitest";
import { ROOM_TYPES, ROOM_COLORS, normalizeRoomSpecs } from "./rooms.js";

describe("ROOM_TYPES", () => {
  it("has a colour defined for every room type", () => {
    for (const type of ROOM_TYPES) {
      expect(ROOM_COLORS[type], `missing colour for ${type}`).toBeDefined();
    }
  });
});

describe("normalizeRoomSpecs", () => {
  it("returns an empty array for a non-array input", () => {
    expect(normalizeRoomSpecs(null)).toEqual([]);
    expect(normalizeRoomSpecs("nope")).toEqual([]);
  });

  it("reads rooms from a { rooms: [...] } wrapper", () => {
    const result = normalizeRoomSpecs({ rooms: [{ name: "Kitchen", length: 12, width: 10 }] });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Kitchen");
  });

  it("accepts a bare array", () => {
    const result = normalizeRoomSpecs([{ name: "Den", length: 9, width: 8 }]);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Den");
  });
});
```

The `ROOM_TYPES`/`ROOM_COLORS` test is genuinely useful beyond this refactor —
it catches a missing colour when someone adds a room type later.

- [ ] **Step 4: Run the tests**

Run: `npm test src/lib/rooms.test.js`
Expected: PASS. Adjust assertions to match real behaviour if they disagree.

- [ ] **Step 5: Import into App.jsx and delete originals**

```javascript
import { ROOM_TYPES, ROOM_COLORS, classifyRoomWithAI, normalizeRoomSpecs } from "./lib/rooms.js";
```

- [ ] **Step 6: Verify**

Run: `npm test && npm run build`

- [ ] **Step 7: Commit**

```bash
git add src/lib/rooms.js src/lib/rooms.test.js src/App.jsx
git commit -m "refactor: extract room classification with tests"
```

---

### Task 6: Canvas drawing primitives

**Files:**
- Create: `src/lib/canvas.js`
- Modify: `src/App.jsx` (remove `drawCover`, `roundRect`, `wrapText`, `drawRoomHighlight`, `drawFloorPlan`)

**Interfaces:**
- Consumes: `C`, `SANS`, `SERIF` from `../theme.js`; `ROOM_COLORS` from `./rooms.js`; `formatRoomDimensions` from `./format.js`
- Produces:
  - `drawCover(ctx, img, x, y, w, h): void`
  - `roundRect(ctx, x, y, w, h, r): void`
  - `wrapText(ctx, text, x, y, maxWidth, lineHeight): number`
  - `drawRoomHighlight(ctx, W, H, p, img, room): void`
  - `drawFloorPlan(ctx, W, H, property, rooms): void`

- [ ] **Step 1: Create src/lib/canvas.js**

Move `drawCover` (84-100), `roundRect` (102-110), `wrapText` (382-398),
`drawRoomHighlight` (400-436), and `drawFloorPlan` (990-1028), adding `export`
to each.

- [ ] **Step 2: Add the imports these functions need**

Before writing them, run:

```bash
grep -n "C\.\|SANS\|SERIF\|ROOM_COLORS\|formatRoomDimensions" src/lib/canvas.js
```

Add exactly the imports the grep proves are used:

```javascript
import { C, SANS, SERIF } from "../theme.js";
import { ROOM_COLORS } from "./rooms.js";
import { formatRoomDimensions } from "./format.js";
```

Drop any import the grep shows is unused — an unused import is a lint smell and
a signal you moved the wrong thing.

- [ ] **Step 3: Import into App.jsx and delete originals**

```javascript
import { drawCover, roundRect, wrapText, drawRoomHighlight, drawFloorPlan } from "./lib/canvas.js";
```

- [ ] **Step 4: Verify the build**

Run: `npm test && npm run build`

- [ ] **Step 5: Verify visually — this task has real regression risk**

Canvas code fails silently: a missing import produces a blank or malformed
image, not an error. Run `npm run dev`, create a property with any address and
price, upload at least one photo, generate ads, and confirm:
- The Instagram Post, Story, Flyer, and Just Sold ads all render with readable text
- The floor plan renders with labelled rooms

Stop the server with Ctrl+C.

- [ ] **Step 6: Commit**

```bash
git add src/lib/canvas.js src/App.jsx
git commit -m "refactor: extract canvas drawing primitives"
```

---

### Task 7: Ad templates

**Files:**
- Create: `src/lib/ads.js`
- Modify: `src/App.jsx` (remove `TEMPLATES`)

**Interfaces:**
- Consumes: `C`, `SANS`, `SERIF` from `../theme.js`; `drawCover`, `roundRect`, `wrapText` from `./canvas.js`; `formatPrice` from `./format.js`
- Produces: `TEMPLATES: Array<{name, w, h, draw}>` — 4 entries

- [ ] **Step 1: Create src/lib/ads.js**

Move `TEMPLATES` (220-380) verbatim. This is a 160-line array of template
objects, each with a `draw` function. Move it whole; do not reformat.

- [ ] **Step 2: Add imports**

Run `grep -n "C\.\|SANS\|SERIF\|drawCover\|roundRect\|wrapText\|formatPrice" src/lib/ads.js`
and add only what is used:

```javascript
import { C, SANS, SERIF } from "../theme.js";
import { drawCover, roundRect, wrapText } from "./canvas.js";
import { formatPrice } from "./format.js";
```

- [ ] **Step 3: Add a structural test**

Create `src/lib/ads.test.js`:

```javascript
import { describe, it, expect } from "vitest";
import { TEMPLATES } from "./ads.js";

describe("TEMPLATES", () => {
  it("defines four ad templates", () => {
    expect(TEMPLATES).toHaveLength(4);
  });

  it("gives every template a name, dimensions, and a draw function", () => {
    for (const template of TEMPLATES) {
      expect(template.name, "template needs a name").toBeTruthy();
      expect(template.w, `${template.name} needs a width`).toBeGreaterThan(0);
      expect(template.h, `${template.name} needs a height`).toBeGreaterThan(0);
      expect(typeof template.draw, `${template.name}.draw must be a function`).toBe("function");
    }
  });
});
```

This does not render anything — it proves the array survived the move intact,
which is exactly what a refactor needs.

- [ ] **Step 4: Import into App.jsx and delete the original**

```javascript
import { TEMPLATES } from "./lib/ads.js";
```

- [ ] **Step 5: Verify**

Run: `npm test && npm run build`

- [ ] **Step 6: Commit**

```bash
git add src/lib/ads.js src/lib/ads.test.js src/App.jsx
git commit -m "refactor: extract ad templates"
```

---

### Task 8: Download and PDF

**Files:**
- Create: `src/lib/download.js`
- Modify: `src/App.jsx` (remove `downloadCanvasAsset`, `createImagePdf`)

**Interfaces:**
- Consumes: nothing from other modules
- Produces:
  - `downloadCanvasAsset(ad: object, format: string, address: string): void`
  - `createImagePdf(base64Jpeg: string, imageWidth: number, imageHeight: number): Blob`

- [ ] **Step 1: Create src/lib/download.js**

Move `downloadCanvasAsset` (1030-1080) and `createImagePdf` (1082-1118)
verbatim, adding `export` to each. Check with grep whether either references
`C`, `SANS`, or `SERIF`; add the theme import only if so.

- [ ] **Step 2: Import into App.jsx and delete originals**

```javascript
import { downloadCanvasAsset, createImagePdf } from "./lib/download.js";
```

- [ ] **Step 3: Verify**

Run: `npm test && npm run build`

- [ ] **Step 4: Verify the download path manually**

Run `npm run dev`, generate ads, and download one as PNG and one as PDF.
Confirm both files open. PDF generation is hand-rolled byte assembly
(`createImagePdf`) and is the most brittle thing in this task. Stop with Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add src/lib/download.js src/App.jsx
git commit -m "refactor: extract download and PDF helpers"
```

---

### Task 9: Marble API client

**Files:**
- Create: `src/lib/marble.js`
- Modify: `src/App.jsx` (remove the World Labs function group)

**Interfaces:**
- Consumes: nothing from other modules
- Produces:
  - `WORLDLABS_BASE: string` — `"/api/marble"`
  - `normalizeWorldLabsKey(value: string): string`
  - `worldlabsCheckProxy(): Promise<{ok, serverKey, claudeKey}>`
  - `worldlabsPrepareUpload(apiKey, fileName, extension): Promise<object>`
  - `worldlabsUploadFile(uploadInfo, blob): Promise<void>`
  - `worldlabsGenerateWorld(apiKey, mediaAssetId, displayName, textPrompt): Promise<{operation_id}>`
  - `worldlabsPollOperation(apiKey, operationId, opts?): Promise<object>`
  - `worldlabsApiError(response, fallback): Promise<Error>`
  - `worldlabsBrowserError(error): string`

This module is rewritten substantially in the splat-viewer plan. Extracting it
cleanly now is what makes that later work tractable.

- [ ] **Step 1: Create src/lib/marble.js**

Move these verbatim, adding `export` to each:

| Symbol | Original lines |
|---|---|
| `WORLDLABS_BASE` | 680 |
| `normalizeWorldLabsKey` | 682-687 |
| `worldlabsCheckProxy` | 689-700 |
| `worldlabsPrepareUpload` | 714-724 |
| `worldlabsUploadFile` | 726-738 |
| `worldlabsGenerateWorld` | 740-758 |
| `worldlabsPollOperation` | 760-783 |
| `worldlabsApiError` | 785-802 |
| `worldlabsBrowserError` | 804-809 |

Keep the `// ---------- World Labs Marble interactive tour ----------` header
comment (677-679) at the top — including the line stating the key is never
persisted. **Do not delete or amend that comment in this plan.** It becomes
false in the persistence plan, and that plan updates it. Changing it here would
make this refactor a behaviour-claim change.

`shrinkForMarble` and `dataUrlToBlob` moved to `photo.js` in Task 3 and do
**not** belong here.

- [ ] **Step 2: Write a test for normalizeWorldLabsKey**

Create `src/lib/marble.test.js`:

```javascript
import { describe, it, expect } from "vitest";
import { normalizeWorldLabsKey } from "./marble.js";

describe("normalizeWorldLabsKey", () => {
  it("strips a pasted WLT-Api-Key header prefix", () => {
    expect(normalizeWorldLabsKey("WLT-Api-Key: abc123")).toBe("abc123");
  });

  it("strips surrounding quotes and whitespace", () => {
    expect(normalizeWorldLabsKey('  "abc123"  ')).toBe("abc123");
  });

  it("returns an empty string for null or undefined", () => {
    expect(normalizeWorldLabsKey(null)).toBe("");
    expect(normalizeWorldLabsKey(undefined)).toBe("");
  });

  it("leaves a clean key untouched", () => {
    expect(normalizeWorldLabsKey("abc123")).toBe("abc123");
  });
});
```

- [ ] **Step 3: Run the test**

Run: `npm test src/lib/marble.test.js`
Expected: PASS.

- [ ] **Step 4: Import into App.jsx and delete originals**

```javascript
import {
  WORLDLABS_BASE, normalizeWorldLabsKey, worldlabsCheckProxy,
  worldlabsPrepareUpload, worldlabsUploadFile, worldlabsGenerateWorld,
  worldlabsPollOperation, worldlabsApiError, worldlabsBrowserError,
} from "./lib/marble.js";
```

Some of these are used only by `MarbleWorldTour`, which moves in Task 11. Import
them into `App.jsx` now and let Task 11 remove the ones that leave with it.

- [ ] **Step 5: Verify**

Run: `npm test && npm run build`

- [ ] **Step 6: Commit**

```bash
git add src/lib/marble.js src/lib/marble.test.js src/App.jsx
git commit -m "refactor: extract World Labs Marble API client with tests"
```

---

### Task 10: Tour geometry

**Files:**
- Create: `src/lib/tour.js`
- Create: `src/lib/tour.test.js`
- Modify: `src/App.jsx` (remove `buildTourRooms`, `layoutTourRooms`)

**Interfaces:**
- Consumes: nothing from other modules (verify with grep; add theme import if needed)
- Produces:
  - `buildTourRooms(draft, photos): Array<{name, length, width, photo?, design?}>`
  - `layoutTourRooms(rooms): Array<object>` — rooms with positions assigned

- [ ] **Step 1: Read both functions**

Run: `sed -n '446,494p' src/App.jsx`

`buildTourRooms` has a documented fallback: when no photo carries measurements
it returns `{name: "Space N", length: 12, width: 10}` placeholders. Your test
asserts that fallback.

- [ ] **Step 2: Create src/lib/tour.js**

Move `buildTourRooms` (446-459) and `layoutTourRooms` (461-493), adding `export`.

- [ ] **Step 3: Write tests**

Create `src/lib/tour.test.js`:

```javascript
import { describe, it, expect } from "vitest";
import { buildTourRooms, layoutTourRooms } from "./tour.js";

describe("buildTourRooms", () => {
  it("falls back to generic spaces when photos carry no measurements", () => {
    const rooms = buildTourRooms({ roomSpecs: [] }, [{ id: "a" }, { id: "b" }]);
    expect(rooms).toHaveLength(2);
    expect(rooms[0].name).toBe("Space 1");
    expect(rooms[0].length).toBe(12);
    expect(rooms[0].width).toBe(10);
  });

  it("uses measured rooms when photos carry them", () => {
    const rooms = buildTourRooms({ roomSpecs: [] }, [
      { id: "a", roomType: "Kitchen", length: 14, width: 11 },
    ]);
    expect(rooms[0].name).toBe("Kitchen");
    expect(rooms[0].length).toBe(14);
  });
});

describe("layoutTourRooms", () => {
  it("returns one laid-out entry per input room", () => {
    const laid = layoutTourRooms([
      { name: "Kitchen", length: 12, width: 10 },
      { name: "Bedroom", length: 11, width: 10 },
    ]);
    expect(laid).toHaveLength(2);
  });

  it("returns an empty array for no rooms", () => {
    expect(layoutTourRooms([])).toEqual([]);
  });
});
```

If the real signatures differ from these calls, fix the test to match the code.

- [ ] **Step 4: Run the tests**

Run: `npm test src/lib/tour.test.js`
Expected: PASS.

- [ ] **Step 5: Import into App.jsx and delete originals**

```javascript
import { buildTourRooms, layoutTourRooms } from "./lib/tour.js";
```

- [ ] **Step 6: Verify**

Run: `npm test && npm run build`

- [ ] **Step 7: Commit**

```bash
git add src/lib/tour.js src/lib/tour.test.js src/App.jsx
git commit -m "refactor: extract tour geometry with tests"
```

---

### Task 11: Shared components

**Files:**
- Create: `src/components/TopBar.jsx`, `src/components/Modal.jsx`, `src/components/Field.jsx`
- Create: `src/components/AnimatedPropertyAdvisor.jsx`
- Create: `src/components/ThreeDPropertyTour.jsx`, `src/components/PanoViewer.jsx`, `src/components/MarbleWorldTour.jsx`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `C`/`SANS`/`SERIF` from `../theme.js`; icons from `../icons.jsx`; `../lib/*` as each component requires
- Produces (all default exports):
  - `TopBar({view, onDashboard, onSelectListings, onCreateAccount})`
  - `Modal({title, onClose, children})`
  - `Field({label, ...props})`
  - `AnimatedPropertyAdvisor()`
  - `ThreeDPropertyTour({draft, photos})`
  - `PanoViewer({url, thumbnail, alt})`
  - `MarbleWorldTour({photos, draft})`

- [ ] **Step 1: Move the three small components first**

| Component | Lines | Notes |
|---|---|---|
| `TopBar` | 1461-1522 | imports `Building2` icon |
| `Modal` | 1523-1539 | |
| `Field` | 1816-1830 | |

Each file starts with `import React from "react";` then the theme and icon
imports it needs. Each ends with `export default ComponentName;` — or declare
as `export default function ComponentName(...)`. Pick one style and use it for
all seven files in this task.

- [ ] **Step 2: Build and smoke test**

Run: `npm run build`, then `npm run dev` and confirm the top bar renders and
"Create account" opens its modal. Ctrl+C.

- [ ] **Step 3: Move AnimatedPropertyAdvisor**

Move `TILE_SVGS` (1619-1623), `ADVISOR_CSS` (1625-1639), and
`AnimatedPropertyAdvisor` (1641-1815) into
`src/components/AnimatedPropertyAdvisor.jsx`. `TILE_SVGS` and `ADVISOR_CSS` are
used only by this component — keep them module-private (no `export`).

- [ ] **Step 4: Verify the advisor animation still runs**

Run `npm run dev` and confirm the animated realtor figure on the dashboard still
renders and moves. `ADVISOR_CSS` is injected as a style tag; if the animation is
frozen, the CSS string did not move correctly. Ctrl+C.

- [ ] **Step 5: Move the three 3D components**

| Component | Lines | Imports needed |
|---|---|---|
| `ThreeDPropertyTour` | 495-676 | `buildTourRooms`, `layoutTourRooms` from `../lib/tour.js`; `ROOM_COLORS` from `../lib/rooms.js` |
| `PanoViewer` | 820-878 | theme only |
| `MarbleWorldTour` | 879-971 | `PanoViewer`; the `worldlabs*` functions from `../lib/marble.js`; `shrinkForMarble` from `../lib/photo.js` |

All three read `THREE` as a **global**, set in `src/main.jsx:7`
(`window.THREE = THREE`). Do **not** add `import * as THREE from "three"` to
these files — that changes how the module resolves and is a behaviour change.
The global pattern is load-bearing and stays until the splat-viewer plan
revisits it.

Verify each file's imports with grep before moving on.

- [ ] **Step 6: Clean up App.jsx imports**

Remove any `lib/marble.js` or `lib/photo.js` import in `App.jsx` that is now
unused because it left with `MarbleWorldTour`. Run:

```bash
npm run build
```

Vite will not error on an unused import, so check by hand: for each symbol in
`App.jsx`'s import list, `grep -c "symbolName" src/App.jsx` should exceed 1.

- [ ] **Step 7: Verify the 3D paths manually**

Run `npm run dev`, create a property, upload a photo, and reach the tour screen.
Confirm the local three.js tour still renders. The Marble tour needs an API key;
if you have none, confirm only that its panel renders with the key prompt rather
than crashing. Ctrl+C.

- [ ] **Step 8: Commit**

```bash
git add src/components src/App.jsx
git commit -m "refactor: extract shared and 3D components"
```

---

### Task 12: Screens

**Files:**
- Create: `src/screens/Dashboard.jsx`, `CreateProperty.jsx`, `UploadPhotos.jsx`, `VirtualTour.jsx`, `Results.jsx`, `PublicListings.jsx`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: components from `../components/*`, helpers from `../lib/*`, theme from `../theme.js`
- Produces (all default exports, props unchanged from today):
  - `Dashboard({properties, onCreate})`
  - `CreateProperty({draft, onChange, onImportFiles, importNotice, onSubmit, error})`
  - `UploadPhotos({...})` — 15 props; copy the destructuring list verbatim from line 1918
  - `VirtualTour({photos, draft})`
  - `Results({ads, photos, draft, onDownload, onDownloadAll, onNew})`
  - `PublicListings()`

- [ ] **Step 1: Move the two simplest screens**

`PublicListings` (1540-1552) and `Dashboard` (1553-1618). `Dashboard` imports
`AnimatedPropertyAdvisor` from `../components/AnimatedPropertyAdvisor.jsx` and
the `Home`/`Plus` icons.

- [ ] **Step 2: Build and check**

Run: `npm run build`, then `npm run dev`, confirm the dashboard and "View
listings" both render. Ctrl+C.

- [ ] **Step 3: Move CreateProperty**

Lines 1831-1917. Imports `Field` from `../components/Field.jsx`.

Note: `App.jsx:1389` passes it an `onImportSpecs` prop that its signature
(line 1831) does not destructure. **This is a pre-existing dead prop. Leave it
exactly as is** — both the passing and the not-receiving. Removing it is a
behaviour change and belongs in its own commit outside this plan.

- [ ] **Step 4: Move UploadPhotos**

Lines 1918-2148, the largest screen at 230 lines. Copy the multi-line props
destructuring block verbatim. Imports `ROOM_TYPES` from `../lib/rooms.js` and
several icons.

- [ ] **Step 5: Move VirtualTour and Results**

`VirtualTour` (2149-2233) imports `ThreeDPropertyTour` and `MarbleWorldTour`.
`Results` (2234-2307) imports `formatPrice` and download helpers.

- [ ] **Step 6: Full manual regression pass**

This is the last structural task, so walk the entire app:

1. Dashboard renders with the animated advisor
2. "Create Property" → fill address and price → Continue
3. Upload two photos → both appear with scores and room dropdowns
4. Change a room label and enter dimensions
5. Generate → all four ads plus room highlights plus the floor plan render
6. Download one ad as PNG and one as PDF → both open
7. The 3D tour renders
8. "View listings" and "Create account" still work
9. The AI disclosure modal in the footer still opens

Any difference from the pre-refactor behaviour is a bug in the move. Fix it
before committing.

- [ ] **Step 7: Commit**

```bash
git add src/screens src/App.jsx
git commit -m "refactor: extract screens"
```

---

### Task 13: Verify the goal and guard the SSRF check

**Files:**
- Create: `server/handlers.test.js`
- Modify: `server/handlers.js` (export `publicHttps` and `isPrivateHost` for testing)
- Modify: `README.md`

**Interfaces:**
- Consumes: nothing
- Produces: `export { publicHttps, isPrivateHost }` from `server/handlers.js`

Rationale: `publicHttps` is the only thing stopping the proxy from being an SSRF
hole, the splat-viewer plan adds a second route that depends on it, and it is a
pure function. It is the highest-value test in the codebase and currently has
none.

- [ ] **Step 1: Export the two guards**

In `server/handlers.js`, change the `const isPrivateHost` and `const publicHttps`
declarations to `export const`. Do not change their logic.

- [ ] **Step 2: Write the test**

Create `server/handlers.test.js`:

```javascript
import { describe, it, expect } from "vitest";
import { publicHttps, isPrivateHost } from "./handlers.js";

describe("isPrivateHost", () => {
  it("flags loopback and private ranges", () => {
    for (const host of ["localhost", "127.0.0.1", "10.1.2.3", "192.168.1.1", "172.16.0.1", "169.254.1.1"]) {
      expect(isPrivateHost(host), `${host} should be private`).toBe(true);
    }
  });

  it("flags .local and .internal suffixes", () => {
    expect(isPrivateHost("printer.local")).toBe(true);
    expect(isPrivateHost("db.internal")).toBe(true);
  });

  it("allows ordinary public hostnames", () => {
    expect(isPrivateHost("api.worldlabs.ai")).toBe(false);
    expect(isPrivateHost("example.com")).toBe(false);
  });
});

describe("publicHttps", () => {
  it("allows https to a public host", () => {
    expect(publicHttps(new URL("https://api.worldlabs.ai/x"))).toBe(true);
  });

  it("rejects plain http", () => {
    expect(publicHttps(new URL("http://api.worldlabs.ai/x"))).toBe(false);
  });

  it("rejects https to a private host", () => {
    expect(publicHttps(new URL("https://127.0.0.1/x"))).toBe(false);
    expect(publicHttps(new URL("https://192.168.0.5/x"))).toBe(false);
  });
});
```

- [ ] **Step 3: Run it**

Run: `npm test server/handlers.test.js`
Expected: PASS.

If any case fails, **do not change the test to match** — a failure here is a
real security gap. Stop and report it.

**These tests characterise current behaviour; they do not certify the guard.**
A verified review found three bypasses that these cases do not cover and that
the guard does not stop:

- `https://[::ffff:127.0.0.1]/` — reaches localhost via IPv6-mapped IPv4
- `https://[fd00::1]/` and `https://[fc00::1]/` — IPv6 unique-local ranges
- any attacker-controlled hostname that resolves to a private IP (DNS
  rebinding — the check never resolves DNS)

Do **not** add these as passing tests, and do not fix them in this plan. They
are tracked in "Known pre-existing issues" and belong to the separate hardening
work described there.

- [ ] **Step 4: Confirm the size goal**

```bash
wc -l src/App.jsx
```

Expected: under 200. If it is larger, find what is still inline and move it.

- [ ] **Step 5: Confirm the refactor changed no behaviour**

```bash
git diff 1d4faa2 --stat -- src/App.jsx
```

Expected: almost entirely deletions.

- [ ] **Step 6: Update the README's "Where things live"**

Replace the line `- \`src/App.jsx\` — the whole app (this is the file to edit)`
with a short map of the new layout:

```markdown
- `src/App.jsx` — view routing and top-level state
- `src/screens/` — one file per screen (Dashboard, CreateProperty, UploadPhotos, Results)
- `src/components/` — shared UI and the 3D viewers
- `src/lib/` — helpers: photos, rooms, canvas, ad templates, Marble API client
- `src/theme.js` — colours and fonts
- `marble-proxy.js` / `server/handlers.js` — the dev/preview backend
```

Also add a "Tests" section:

```markdown
## Tests
`npm test` runs the unit tests once. `npm run test:watch` watches.
```

- [ ] **Step 7: Full test run and commit**

```bash
npm test && npm run build
git add server/handlers.js server/handlers.test.js README.md
git commit -m "test: cover the proxy SSRF guard; document the new layout"
```

---

## Definition of done

- [ ] `npm test` passes
- [ ] `npm run build` succeeds
- [ ] `src/App.jsx` is under 200 lines
- [ ] The full manual pass in Task 12 Step 6 behaves exactly as it did at commit `1d4faa2`
- [ ] 13 commits, one per task
- [ ] No feature added, no bug fixed, no symbol renamed

## Known pre-existing issues — deliberately NOT fixed here

Recorded so a reviewer does not mistake them for refactor damage:

1. `App.jsx:1389` passes `onImportSpecs` to `CreateProperty`, which never destructures it. Dead prop.
2. `MarbleWorldTour` reads `assets.imagery.pano_url` while the World Labs docs describe `assets.pano_url`. Unresolved — see the spec.
3. Nothing persists across refresh. That is the next plan.
4. Components read `THREE` from `window` rather than importing it.

**Verified security findings in `server/handlers.js`** (all pre-existing at
commit `1d4faa2`; low risk while the server is localhost-only, serious once
deployed publicly):

5. **SSRF bypasses in `publicHttps`** (`handlers.js:34`) — hostname is checked
   as a string and DNS is never resolved. `[::ffff:127.0.0.1]`, `fd00::/8`,
   `fc00::/7`, and DNS rebinding all pass. IPv4 literals and cloud-metadata
   addresses are correctly blocked.
6. **Header injection** (`handlers.js:64`) — `x-upload-headers` is
   client-controlled JSON spread into the outgoing `fetch`. The request method
   (`x-upload-method`) is client-controlled too. Combined with finding 5, a
   visitor chooses both destination and headers.
7. **No authentication on any route** — any caller spends the operator's
   Anthropic and World Labs credits. Already documented in the README.
8. **Unbounded request body** (`handlers.js:22`) — `readBody` accumulates
   chunks with no size cap; a large POST exhausts memory.

Findings 5 and 6 must be resolved before `/api/marble-splat` ships in Plan 3,
since that route reuses the same guard.

## Next plans

- **Plan 2 — Persistence:** `storage.js`, IndexedDB for photos, settings screen, API key in localStorage.
- **Plan 3 — Splat viewer:** Spark, the `/api/marble-splat` route, first-person controls, sample property.
