# Mobile Portrait Layout Redesign

## Overview

Redesign all UI layouts for mobile portrait (1080×1920) while keeping desktop landscape (1920×1080) unchanged. Detection: `'ontouchstart' in window`.

## Resolution

| Platform | Internal | CSS |
|----------|----------|-----|
| Desktop | 1920×1080 | scaled to fit viewport, letterboxed |
| Mobile | 1080×1920 | scaled to fit viewport, letterboxed |

CSS: canvas positioned `absolute; top:50%; left:50%; transform:translate(-50%,-50%)`, JS sets `style.width/height` via `fitCanvas()` (scale = min(viewportW/canvasW, viewportH/canvasH)).

Coordinate mapping: `toCanvasXY()` multiplies by `canvas.width / rect.width` ratio — already universal.

## Screen Layouts

### 1. Playing HUD

- **Game area**: full 1080×1920 canvas, no sidebars
- **Floating HP capsule**: top-center, semi-transparent dark bg, shows HP bar + level
- **Time/kills/boss**: below capsule, small gray text
- **Buff chips**: below time, centered row of small colored tags
- **Skill buttons**: 3 floating circular buttons (44px), right side, vertically centered, no background panel. CD displayed below each button
- **Joystick**: bottom-left, 60px zone
- **Backpack button**: top-left, 32px circle
- **Pause button**: top-right, 32px circle
- **PC skill bar at bottom**: hidden on mobile (`ontouchstart` check, already in place)

### 2. Prepare Screen

Tab-based layout with two tabs:

**Tab "装备 & 属性":**
- Title "准备战斗" centered at top
- Character bar: "角色：勇者 [切换] [+新角色]" centered row
- Stats row: Lv, ATK, HP, CDR, coins in a compact horizontal row
- Equipment grid: 4×2 grid, larger cards (270px each) showing equipped item name, stat, quality color border, legendary tag
- Testfield button below equipment

**Tab "关卡选择":**
- Title "选择关卡" centered
- Stage cards as vertical list items (not grid), each showing: name, difficulty, monster level range
- Locked stages grayed out with lock icon
- Selected stage highlighted with blue border

### 3. Backpack

- 4-column grid (270px per card, ~10 cards first screen)
- Each card: item name (bold, quality-colored), stat value, ilvl, legendary tag
- Quality-colored border
- Discard button: small ✕ in corner of each card
- Scrollable via touch drag (existing `bpScroll` mechanism, deltaY scaled)

**Equipment interaction (tap, no hover):**
- Tap item → bottom panel slides up (~180px)
- Panel shows: left = current equipped, right = selected item, arrow between
- Stat diff in green (up) / red (down)
- Two buttons at bottom: "装备" (green) / "丢弃" (red)
- Tap outside panel area → close
- On prepare screen, tap without panel = direct equip (no compare needed — user likely wants to fill empty slots)
- On combat screen, backpack is view-only (already the case)

### 4. Main Menu

Same as desktop: centered title "DIABLO LITE", tagline, "开始游戏" button, export/import buttons below, version text at bottom. Just vertically centered in 1080×1920.

### 5. Death Screen

Centered overlay: red "你死了" large text, loot loss warning, kill/survival stats, red "返回准备" button. Same logic as desktop, just positioned for portrait.

### 6. Pause Menu

Same as desktop: centered dialog with warning text and two buttons (确认返回 / 取消). Boss-defeated state shows different text.

### 7. Victory Screen

Already unreachable (no code sets `game.screen = 'victory'`). No changes needed. The `renderVictory` function remains in renderer.js but is dead code — do not remove in this PR.

### 8. Character Select (overlay)

Adapt existing `renderCharSelect` to 1080×1920: wider dialog, adjust scroll area height. Same interaction model.

### 9. Testfield

Adapt existing `renderTestField` to 1080×1920: stack panels vertically, use tabs for loadout/config.

## Implementation Strategy

All layout changes in `js/renderer.js`. Detect mobile via `'ontouchstart' in window` and branch layout calculations. Key pattern:

```js
const isMobile = 'ontouchstart' in window;
const W = canvas.width;  // 1080 on mobile, 1920 on desktop
const H = canvas.height; // 1920 on mobile, 1080 on desktop
```

Each render function checks `isMobile` at the top and uses different position calculations. Shared rendering helpers (roundRect, drawButton, etc.) are resolution-independent.

## Coordinate System

- `toCanvasXY()` already handles CSS→canvas coordinate mapping via `canvas.width / rect.width`
- `canvasScaleY()` for scroll delta mapping
- All button hit-testing uses canvas-space coordinates — consistent on both platforms
- World coordinates (camera, player position) are resolution-independent (0–20000 map space)

## Files to Modify

| File | Change |
|------|--------|
| `js/main.js` | Already done: 1080×1920 on mobile, 1920×1080 on desktop |
| `js/input.js` | Already done: toCanvasXY, canvasScaleY, fitCanvas resize |
| `js/mobile.js` | Already done: toCanvasXY import, scaled deltaY |
| `index.html` | Already done: centered canvas CSS |
| `js/renderer.js` | **Main work**: branch all layout functions for portrait mobile |

## What Stays the Same

- All game logic (player, monsters, skills, drops, buffs, etc.)
- Desktop layout (1920×1080, unchanged)
- Touch input handling (joystick, skill drag-to-cast)
- Persistence, audio, particles
- Coordinate conversion layer (toCanvasXY, canvasScaleY)
