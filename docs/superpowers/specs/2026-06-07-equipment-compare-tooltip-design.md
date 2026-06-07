# Equipment Compare Tooltip Design

**Date**: 2026-06-07
**Status**: Approved

---

## Overview

Replace the click-to-view-item-detail popup with a hover-triggered comparison tooltip. Item interactions (pick up, put back, equip, discard) remain click-based on the item cell itself.

## Scope

- Victory/loot screen: ground drops and backpack items
- Backpack overlay (prepare and combat screens)

## Key Behaviors

### Interaction

| Screen | Hover | Click |
|--------|-------|-------|
| Victory - ground item | Show comparison tooltip | Pick up to backpack |
| Victory - backpack item | Show comparison tooltip | Put back on ground |
| Backpack (prepare) | Show comparison tooltip | Equip item |
| Backpack (combat) | Show comparison tooltip | Discard via X button |

No action buttons inside the tooltip — it is purely informational.

### Layout

Fixed-position panel on the right side of the screen. Two cards side by side:
- **Left card**: Currently equipped item in the matching slot (or "空" if none)
- **Right card**: The hovered item

### Stat Difference Marking

| Condition | Visual |
|-----------|--------|
| Higher value | Green text with ↑ and difference |
| Lower value | Red text with ↓ and difference |
| New stat (slot was empty) | Gold text with ✦ |
| Same value | White text (no marker) |
| Legendary power present | Orange ★ marker, compared if both have one |

## Implementation

Single new rendering function `renderCompareTooltip(hoveredItem, slotKey)` called from `renderVictory()` and `renderBackpackOverlay()`. Removes the old `game.viewingItem` popup logic from victory screen. Item click actions move from popup buttons to the item cell hover buttons.
