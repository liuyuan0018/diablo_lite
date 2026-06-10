# Mobile Portrait Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adapt all UI in `js/renderer.js` for mobile portrait (1080×1920), branching on `'ontouchstart' in window`.

**Architecture:** Each render function gets an `isMobile` branch at the top. The same rendering primitives (roundRect, ctx methods) serve both layouts — only position/size calculations differ. Desktop 1920×1080 layout is unchanged.

**Tech Stack:** Vanilla JS Canvas 2D, no framework.

---

### Task 1: Playing HUD — renderHUD + renderBuffBar

**Files:**
- Modify: `js/renderer.js:1117-1242` (renderHUD), `js/renderer.js:1035-1115` (renderBuffBar), `js/renderer.js:973-1023` (renderSkillPreview)

**Mobile layout:**
- Top bar removed (info goes to floating capsule)
- HP/level: floating capsule at top-center
- Time/kills/boss: small text below capsule
- Buff chips: centered row below stats
- Skill bar: hidden (handled by HTML mobile controls — already `if (!('ontouchstart' in window))` guard)
- Skill preview: already has mobile branch, verify it works at 1080×1920

- [ ] **Step 1: Add mobile branch in renderHUD**

Replace `renderHUD()` with mobile-aware version. Current PC layout stays; mobile gets floating capsule.

```js
function renderHUD(){
  const W=canvas.width,H=canvas.height;
  const isMobile = 'ontouchstart' in window;
  const p=game.player;

  if (isMobile) {
    // Floating HP/Lv capsule at top-center
    const capW = 260, capH = 44, capX = W/2 - capW/2, capY = 8;
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    roundRect(ctx, capX, capY, capW, capH, capH/2);
    ctx.fill(); ctx.stroke();

    // HP bar inside capsule
    const barX = capX + 50, barY = capY + 10, barW = 120, barH = 8;
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = '#cc2222';
    ctx.fillRect(barX, barY, barW * (p.hp / p.maxHp), barH);

    // HP text
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('HP', capX + 12, capY + 14);
    ctx.fillStyle = '#fff';
    ctx.font = '11px sans-serif';
    ctx.fillText(Math.floor(p.hp) + '/' + p.maxHp, capX + 32, capY + 14);

    // Level center
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('Lv.' + p.level, capX + capW/2, capY + 30);

    // Exp bar
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY + barH + 2, barW, 3);
    ctx.fillStyle = '#4488ff';
    ctx.fillRect(barX, barY + barH + 2, barW * (p.exp / p.expToNext), 3);

    // Backpack count right side of capsule
    ctx.textAlign = 'right';
    ctx.fillStyle = game.backpack.length >= 8 ? '#f88' : '#aaa';
    ctx.font = '10px sans-serif';
    ctx.fillText('包:' + game.backpack.length + '/8', capX + capW - 12, capY + 14);

    // Time / kills / boss below capsule
    const infoY = capY + capH + 8;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#888';
    ctx.font = '10px sans-serif';
    let infoStr = formatTime(game.time) + ' | 击杀: ' + game.kills;
    if (!game.bossSpawned) {
      infoStr += ' | Boss: ' + game.kills + '/' + game.killsForBoss;
    } else if (!game.bossDefeated) {
      ctx.fillStyle = '#ff4444';
      infoStr = 'BOSS已出现!';
    }
    ctx.fillText(infoStr, W/2, infoY);

    // Boss defeated indicator (same as desktop but positioned for mobile)
    if (game.bossDefeated) {
      const bw = 280, bh = 28;
      const bx = W/2 - bw/2, by = infoY + 8;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 1;
      roundRect(ctx, bx, by, bw, bh, 4);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Boss 已击败 · 点击暂停返回', bx + bw/2, by + bh/2 + 4);
    }

    renderBuffBar(W, H);
    // Skill bar is hidden via existing `if (!('ontouchstart' in window))` guard
    return;
  }

  // === Desktop HUD unchanged below ===
  ctx.fillStyle='rgba(0,0,0,0.75)';
  // ... existing desktop HUD code ...
}
```

- [ ] **Step 2: Update renderBuffBar for mobile to position below the floating capsule**

The `renderBuffBar` function currently hardcodes `barY = H - 135`. On mobile, position it below the capsule area.

```js
function renderBuffBar(W, H){
  // ...
  const isMobile = 'ontouchstart' in window;
  const barY = isMobile ? 70 : H - 135;
  // ... rest unchanged, barY used for positioning
}
```

- [ ] **Step 3: Verify skill preview works on mobile**

The `renderSkillPreview` already checks `if ('ontouchstart' in window) { if (!game.skillDrag.active) return; }`. No changes needed — teleport crosshair and skill radius circles will render correctly at 1080×1920.

- [ ] **Step 4: Visual verification**

Run the server, open on mobile (or Chrome DevTools mobile emulation). Verify:
- Floating HP/Lv capsule visible at top-center
- HP bar and exp bar rendering correctly
- Time/kills/boss info below capsule
- Buff chips below that
- No desktop top bar or bottom skill bar

- [ ] **Step 5: Commit**

```bash
git add js/renderer.js
git commit -m "feat: mobile portrait HUD with floating HP capsule

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 2: Prepare Screen — Tab-based layout

**Files:**
- Modify: `js/renderer.js:110-310` (renderPrepare)

**Mobile layout:**
- Two tabs: "装备 & 属性" / "关卡选择"
- Tab "装备 & 属性": title, character bar, stats row, 4×2 equipment grid, testfield button
- Tab "关卡选择": title, stage list (vertical cards), testfield button
- Track active tab in game state: `game.prepareTab = 'equip' | 'stages'`

- [ ] **Step 1: Add game state for prepare tab**

In `js/game-state.js`, add near other UI state:

```js
// In the game object initialization
prepareTab: 'equip',  // 'equip' | 'stages'
```

- [ ] **Step 2: Rewrite renderPrepare for mobile with tabs**

At the top of `renderPrepare()`, add mobile branch:

```js
function renderPrepare(){
  const W=canvas.width,H=canvas.height;
  const isMobile = 'ontouchstart' in window;

  if (isMobile) {
    ctx.fillStyle='#0a0a12';ctx.fillRect(0,0,W,H);
    game.hoveredItem=null;
    prepButtons=[];

    // Title
    ctx.textAlign='center';
    ctx.font='bold 28px sans-serif';
    ctx.fillStyle='#ffd700';
    ctx.fillText('准备战斗', W/2, 36);

    // Character bar
    const activeChar=getActiveCharacter();
    const charName = activeChar ? activeChar.name : '--';
    ctx.font='13px sans-serif';
    const labelW = ctx.measureText('角色：').width;
    ctx.font='bold 14px sans-serif';
    const nameW = ctx.measureText(charName).width;
    const charBarY = 46;
    const charH = 28;
    const totalGroupW = labelW + 4 + nameW + 10 + 130;
    const groupStartX = W/2 - totalGroupW/2;

    ctx.font='13px sans-serif';
    ctx.fillStyle='#888';
    ctx.textAlign='left';
    ctx.fillText('角色：', groupStartX, charBarY + charH/2 + 5);
    const nameX = groupStartX + labelW + 4;
    ctx.fillStyle='#ffd700';
    ctx.font='bold 14px sans-serif';
    ctx.fillText(charName, nameX, charBarY + charH/2 + 5);

    // Switch button
    const switchBX = nameX + nameW + 10, switchBY = charBarY;
    const switchW = 70, switchBH = charH;
    const switchHover=game.mouseX>=switchBX&&game.mouseX<=switchBX+switchW&&game.mouseY>=switchBY&&game.mouseY<=switchBY+switchBH;
    ctx.fillStyle=switchHover?'#335577':'#1a2a3a';
    ctx.strokeStyle=switchHover?'#88ccff':'#4488ff';ctx.lineWidth=1;
    roundRect(ctx,switchBX,switchBY,switchW,switchBH,4);
    ctx.fill();ctx.stroke();
    ctx.fillStyle='#8af';ctx.font='11px sans-serif';
    ctx.textAlign='center';
    ctx.fillText('切换 ▶',switchBX+switchW/2,switchBY+switchBH/2+4);

    // New button
    const newBX = switchBX + switchW + 6;
    const newW = 54;
    const newHover=game.mouseX>=newBX&&game.mouseX<=newBX+newW&&game.mouseY>=switchBY&&game.mouseY<=switchBY+switchBH;
    ctx.fillStyle=newHover?'#335533':'#1a2a1a';
    ctx.strokeStyle=newHover?'#88ff88':'#44aa44';ctx.lineWidth=1;
    roundRect(ctx,newBX,switchBY,newW,switchBH,4);
    ctx.fill();ctx.stroke();
    ctx.fillStyle='#8f8';ctx.font='11px sans-serif';
    ctx.textAlign='center';
    ctx.fillText('+新',newBX+newW/2,switchBY+switchBH/2+4);

    prepButtons.push(
      {x:switchBX,y:switchBY,w:switchW,h:charH,action:()=>{game.showCharSelect=true;}},
      {x:newBX,y:switchBY,w:newW,h:charH,action:()=>{/* create character — same as desktop */}},
    );

    // Stats row
    const stats=calcPlayerStats();
    const statY = charBarY + charH + 12;
    ctx.fillStyle='#111122';ctx.strokeStyle='#334';ctx.lineWidth=1;
    roundRect(ctx, 20, statY, W-40, 32, 6);
    ctx.fill();ctx.stroke();
    ctx.textAlign='center';
    ctx.font='12px sans-serif';
    const statStr = 'Lv.'+game.player.level+' | ⚔'+stats.atk+' | ❤'+stats.maxHP+' | CD:'+stats.cdr+'% | 💰'+game.soulCoins;
    ctx.fillStyle='#ccc';
    ctx.fillText(statStr, W/2, statY+21);

    // Tabs
    const tabY = statY + 42;
    const tabW = (W - 60) / 2;
    const tabH = 35;
    if (!game.prepareTab) game.prepareTab = 'equip';

    for (const tab of [
      { id: 'equip', label: '装备 & 属性' },
      { id: 'stages', label: '关卡选择' },
    ]) {
      const tx = tab.id === 'equip' ? 30 : 30 + tabW;
      const active = game.prepareTab === tab.id;
      ctx.fillStyle = active ? '#1a2a3e' : '#0a0a1a';
      ctx.strokeStyle = active ? '#ffd700' : '#334';
      ctx.lineWidth = active ? 2 : 1;
      roundRect(ctx, tx, tabY, tabW, tabH, 6);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = active ? '#ffd700' : '#888';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(tab.label, tx + tabW/2, tabY + tabH/2 + 5);
      prepButtons.push({ x: tx, y: tabY, w: tabW, h: tabH, action: () => { game.prepareTab = tab.id; } });
    }

    const contentY = tabY + tabH + 12;

    if (game.prepareTab === 'equip') {
      // Equipment grid 4×2
      const eqX = 20, eqW = W - 40, eqH = 340;
      renderEquipGrid(eqX, contentY, eqW, eqH, game.equipment, equipSlots, prepButtons);
      // Testfield button
      const tfBtnW = 200, tfBtnH = 44;
      const tfBtnX = W/2 - tfBtnW/2, tfBtnY = contentY + eqH + 10;
      const tfHover = game.mouseX >= tfBtnX && game.mouseX <= tfBtnX + tfBtnW && game.mouseY >= tfBtnY && game.mouseY <= tfBtnY + tfBtnH;
      ctx.fillStyle = tfHover ? '#2a2a1a' : '#1a1a0a';
      ctx.strokeStyle = tfHover ? '#ffd700' : '#886600';
      ctx.lineWidth = tfHover ? 2 : 1;
      roundRect(ctx, tfBtnX, tfBtnY, tfBtnW, tfBtnH, 6);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚔ 测试场', tfBtnX + tfBtnW / 2, tfBtnY + tfBtnH / 2 + 6);
      prepButtons.push({ x: tfBtnX, y: tfBtnY, w: tfBtnW, h: tfBtnH, action: () => { startTestfield(); } });
    } else {
      // Stage select as vertical list
      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = '#ffd700';
      ctx.textAlign = 'center';
      ctx.fillText('选择关卡', W/2, contentY);

      const itemH = 66, gap = 6, listY = contentY + 20;
      const visibleH = H - listY - 60;
      for (let i = 0; i < 10; i++) {
        const iy = listY + i * (itemH + gap);
        if (iy + itemH < listY || iy > listY + visibleH) continue;
        const unlocked = game.unlockedStages[i];
        const bx = 30, bw = W - 60;

        const bg = unlocked ? (game.stageIndex === i ? '#1a2a4a' : '#111a2a') : '#1a1a1a';
        const bd = unlocked ? (game.stageIndex === i ? '#4488ff' : '#334') : '#222';
        ctx.fillStyle = bg; ctx.strokeStyle = bd; ctx.lineWidth = unlocked && game.stageIndex === i ? 2 : 1;
        roundRect(ctx, bx, iy, bw, itemH, 8);
        ctx.fill(); ctx.stroke();

        ctx.textAlign = 'left';
        ctx.fillStyle = unlocked ? '#8af' : '#555';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(unlocked ? STAGES[i].name : '🔒 未解锁', bx + 16, iy + 24);
        ctx.fillStyle = unlocked ? '#888' : '#444';
        ctx.font = '11px sans-serif';
        ctx.fillText(DIFFICULTY[i].desc, bx + 16, iy + 46);

        if (unlocked) {
          prepButtons.push({
            x: bx, y: iy, w: bw, h: itemH,
            text: STAGES[i].name, idx: i, enabled: true, type: 'stageSelect',
          });
        }
      }

      // Testfield button at bottom
      const tfBtnW = 200, tfBtnH = 44;
      const tfBtnX = W/2 - tfBtnW/2, tfBtnY = H - tfBtnH - 10;
      const tfHover = game.mouseX >= tfBtnX && game.mouseX <= tfBtnX + tfBtnW && game.mouseY >= tfBtnY && game.mouseY <= tfBtnY + tfBtnH;
      ctx.fillStyle = tfHover ? '#2a2a1a' : '#1a1a0a';
      ctx.strokeStyle = tfHover ? '#ffd700' : '#886600';
      ctx.lineWidth = tfHover ? 2 : 1;
      roundRect(ctx, tfBtnX, tfBtnY, tfBtnW, tfBtnH, 6);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚔ 测试场', tfBtnX + tfBtnW/2, tfBtnY + tfBtnH/2 + 6);
      prepButtons.push({ x: tfBtnX, y: tfBtnY, w: tfBtnW, h: tfBtnH, action: () => { startTestfield(); } });
    }

    // Character select overlay and equip detail still render if open
    if (game.showCharSelect) { renderCharSelect(); return; }
    if (game.selectedEquipSlot) { renderEquipDetail(); }
    if (game.hoveredItem && !game.selectedEquipSlot) { renderCompareTooltip(game.hoveredItem); }
    return;
  }

  // === Desktop layout unchanged below ===
  // ... existing renderPrepare code ...
}
```

**Note:** The character-creation action in prepButtons for the "+新" button needs the full create-character logic (copy from existing desktop code at renderer.js:176-188).

- [ ] **Step 3: Adapt renderEquipGrid for 4-column mobile layout**

The `renderEquipGrid` function currently uses `cellW = 90` hardcoded. On mobile, cells should be wider (~250px) for a 4-column grid. Adjust `cellW` based on the grid width divided by 8 (since it's 8 slots in a 4×2 layout):

In `renderEquipGrid`, detect mobile and adjust cell size:

```js
function renderEquipGrid(ex, ey, ew, eh, equipSource, slotsArray, buttonsArray) {
  const isMobile = 'ontouchstart' in window;
  const cols = 4;
  const gap = isMobile ? 8 : 6;
  const cellW = isMobile ? Math.floor((ew - gap * 3) / 4) : 90;
  const cellH = isMobile ? cellW + 20 : cellW + 24;
  const rows = 2;
  // ... rest reuses existing code with these values
}
```

- [ ] **Step 4: Visual verification**

Run on mobile view: verify tab switching, equipment grid rendering, stage list, testfield button.

- [ ] **Step 5: Commit**

```bash
git add js/renderer.js js/game-state.js
git commit -m "feat: mobile portrait prepare screen with tabs

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 3: Backpack — 4-column + bottom compare panel

**Files:**
- Modify: `js/renderer.js:1295-1410` (renderBackpackOverlay), `js/renderer.js:1412-1640` (renderCompareTooltip)

**Mobile layout:**
- 4-column grid with larger cards
- Tap item → bottom panel slides up showing comparison
- Bottom panel: left=current equip, right=selected item, equip/discard buttons
- Track selected backpack item: `game.bpSelectedIndex` (null when nothing selected)

- [ ] **Step 1: Add game state for backpack selection**

In `js/game-state.js`:

```js
bpSelectedIndex: null,  // index in backpack array, null = no selection
```

- [ ] **Step 2: Rewrite renderBackpackOverlay with mobile branch**

At the top of `renderBackpackOverlay()`, add mobile branch:

```js
export function renderBackpackOverlay(){
  const W=canvas.width,H=canvas.height;
  const isMobile = 'ontouchstart' in window;

  if (isMobile) {
    ctx.fillStyle='rgba(0,0,0,0.7)';
    ctx.fillRect(0,0,W,H);
    game.hoveredItem=null;

    // Header
    const pw = Math.min(1000, W - 20), ph = H - 260; // leave room for bottom panel
    const px = (W - pw) / 2, py = 20;
    ctx.textAlign='center';
    ctx.font='bold 18px sans-serif';
    ctx.fillStyle='#ffd700';
    const bpTitle = '背包 (' + game.backpack.length + (game.screen==='playing'?'/8':'') + ')';
    ctx.fillText(bpTitle, W/2, py + 22);
    ctx.fillStyle='#888'; ctx.font='10px sans-serif';
    ctx.fillText('点击物品查看详情 | ✕丢弃 | 点击外部关闭', W/2, py + 42);

    const cols = 4, gap = 8;
    const cellW = Math.floor((pw - gap * 3) / 4);
    const rowH = cellW + gap + 28;
    const gridY = py + 52, viewH = ph - 60;
    const rows = Math.ceil(game.backpack.length / cols);
    const maxScroll = Math.max(0, rows * rowH - viewH);
    game.bpScroll = Math.min(game.bpScroll, maxScroll);

    const bp = game.backpack;
    const statLabels = {atk:'攻',cdr:'CD',maxHp:'命',bulletSpeed:'速',pickupRange:'拾',movespeed:'移'};

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, gridY, W, viewH);
    ctx.clip();

    if (bp.length === 0) {
      ctx.fillStyle='#555'; ctx.font='14px sans-serif';
      ctx.textAlign='center';
      ctx.fillText('背包为空', W/2, gridY + 80);
    } else {
      for (let i = 0; i < bp.length; i++) {
        const col = i % cols, row = Math.floor(i / cols);
        const cx = px + col * (cellW + gap);
        const cy = gridY + row * rowH - game.bpScroll;
        if (cy + rowH < gridY || cy > gridY + viewH) continue;

        const item = bp[i];
        const isSelected = game.bpSelectedIndex === i;
        const hover = game.mouseX >= cx && game.mouseX <= cx + cellW && game.mouseY >= cy && game.mouseY <= cy + cellW + 18;

        ctx.fillStyle = '#1a1a2e';
        ctx.strokeStyle = isSelected ? '#ffd700' : (QUALITY_COLORS[item.quality] || '#555');
        ctx.lineWidth = isSelected ? 2 : 1;
        roundRect(ctx, cx, cy, cellW, cellW + 18, 6);
        ctx.fill(); ctx.stroke();

        ctx.fillStyle = QUALITY_COLORS[item.quality] || '#aaa';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Lv.' + item.ilvl, cx + cellW/2, cy + 10);
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(item.name, cx + cellW/2, cy + cellW/2);

        if (item.stat === 'artifact' && item.desc) {
          ctx.fillStyle = '#ffaa44'; ctx.font = '8px sans-serif';
          ctx.fillText(item.desc, cx + cellW/2, cy + cellW/2 + 12);
        } else {
          ctx.font = '10px sans-serif';
          ctx.fillStyle = '#ccc';
          ctx.fillText((statLabels[item.stat]||'?') + '+' + item.statValue, cx + cellW/2, cy + cellW/2 + 12);
        }

        if (item.power) {
          ctx.fillStyle = '#ff6600'; ctx.font = 'bold 8px sans-serif';
          ctx.fillText('★传奇', cx + cellW/2, cy + cellW/2 + 26);
        }

        // Discard X button
        const dx = cx + cellW - 16, dy = cy - 4, dw = 16, dh = 16;
        const dhover = game.mouseX >= dx && game.mouseX <= dx + dw && game.mouseY >= dy && game.mouseY <= dy + dh;
        ctx.fillStyle = dhover ? '#ff4444' : '#662222';
        ctx.fillRect(dx, dy, dw, dh);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 10px sans-serif';
        ctx.fillText('✕', dx + dw/2, dy + dh/2 + 4);

        if (dhover && game.mouseDown && !game.clickProcessed) {
          game.clickProcessed = true;
          // Drop item to world
          game.drops.push({...item, x: game.player.x + (Math.random()-0.5)*160, y: game.player.y + (Math.random()-0.5)*160, bobPhase: Math.random()*Math.PI*2});
          game.backpack.splice(i, 1);
          if (game.bpSelectedIndex === i) game.bpSelectedIndex = null;
          saveGame();
          ctx.restore(); return;
        }

        // Tap to select/deselect
        if (hover && game.mouseDown && !game.clickProcessed) {
          game.clickProcessed = true;
          if (game.bpSelectedIndex === i) {
            game.bpSelectedIndex = null;
          } else {
            game.bpSelectedIndex = i;
          }
        }

        // Equip on prepare screen
        const canEquip = game.screen === 'prepare' || game.screen === 'victory';
        if (canEquip && hover && game.mouseDown && !game.clickProcessed) {
          game.clickProcessed = true;
          equipFromBackpack(i);
        }
      }
    }
    ctx.restore();

    // Scrollbar
    if (maxScroll > 0) {
      const sbX = W - 12, sbH = viewH;
      ctx.fillStyle = '#222';
      ctx.fillRect(sbX, gridY, 6, sbH);
      const thumbH = Math.max(30, sbH * (viewH / (rows * rowH)));
      const thumbY = gridY + (sbH - thumbH) * (game.bpScroll / maxScroll);
      ctx.fillStyle = '#666';
      roundRect(ctx, sbX, thumbY, 6, thumbH, 3);
      ctx.fill();
    }

    // Bottom compare panel
    if (game.bpSelectedIndex !== null && game.backpack[game.bpSelectedIndex]) {
      renderMobileComparePanel(game.backpack[game.bpSelectedIndex], W, H);
    }

    return;
  }

  // === Desktop layout unchanged below ===
  // ... existing renderBackpackOverlay code ...
}
```

- [ ] **Step 3: Create renderMobileComparePanel function**

Add new function to renderer.js:

```js
function renderMobileComparePanel(item, W, H) {
  const panelH = 220;
  const py = H - panelH;
  const statDesc = {atk:'攻击力',cdr:'冷却缩减',maxHp:'最大生命',bulletSpeed:'弹道速度',pickupRange:'拾取范围',movespeed:'移动速度'};
  const eqSource = game.sandboxEquipment || game.equipment;
  const equipped = eqSource[item.slot];
  const canEquip = game.screen === 'prepare' || game.screen === 'victory';

  ctx.fillStyle = 'rgba(10,10,25,0.97)';
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 2;
  roundRect(ctx, 0, py, W, panelH, 0);
  ctx.fill(); ctx.stroke();
  // Top border line
  ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(W, py); ctx.stroke();

  // Left: current equip
  const leftX = 40, leftW = (W - 160) / 2;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#888'; ctx.font = '11px sans-serif';
  ctx.fillText('当前装备', leftX + leftW/2, py + 22);
  if (equipped) {
    ctx.fillStyle = QUALITY_COLORS[equipped.quality] || '#aaa';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(equipped.name, leftX + leftW/2, py + 48);
    ctx.fillStyle = '#ccc'; ctx.font = '12px sans-serif';
    ctx.fillText((statDesc[equipped.stat]||'') + ' +' + equipped.statValue, leftX + leftW/2, py + 70);
  } else {
    ctx.fillStyle = '#555'; ctx.font = '13px sans-serif';
    ctx.fillText('（空槽位）', leftX + leftW/2, py + 55);
  }

  // Arrow
  ctx.fillStyle = '#ffd700'; ctx.font = 'bold 20px sans-serif';
  ctx.fillText('→', W/2, py + 55);

  // Right: selected item
  const rightX = W/2 + 80, rightW = leftW;
  ctx.fillStyle = '#ffd700'; ctx.font = '11px sans-serif';
  ctx.fillText('选中物品', rightX + rightW/2, py + 22);
  ctx.fillStyle = QUALITY_COLORS[item.quality] || '#aaa';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(item.name, rightX + rightW/2, py + 48);

  if (equipped) {
    const diff = item.statValue - equipped.statValue;
    if (diff > 0) {
      ctx.fillStyle = '#44ff44';
      ctx.fillText('↑ +' + diff, rightX + rightW/2, py + 70);
    } else if (diff < 0) {
      ctx.fillStyle = '#ff4444';
      ctx.fillText('↓ ' + diff, rightX + rightW/2, py + 70);
    } else {
      ctx.fillStyle = '#ccc';
      ctx.fillText('=', rightX + rightW/2, py + 70);
    }
  } else {
    ctx.fillStyle = '#ffd700'; ctx.font = '12px sans-serif';
    ctx.fillText((statDesc[item.stat]||'') + ' +' + item.statValue + ' ✦新', rightX + rightW/2, py + 70);
  }

  // Buttons
  const btnW = 140, btnH = 44, btnY = py + 140;
  if (canEquip) {
    const equipBX = W/2 - btnW - 16;
    const equipHover = game.mouseX >= equipBX && game.mouseX <= equipBX + btnW && game.mouseY >= btnY && game.mouseY <= btnY + btnH;
    ctx.fillStyle = equipHover ? '#2a4a2a' : '#1a3a1a';
    ctx.strokeStyle = equipHover ? '#fff' : '#44ff44'; ctx.lineWidth = 2;
    roundRect(ctx, equipBX, btnY, btnW, btnH, 8);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#8f8'; ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('装备', equipBX + btnW/2, btnY + btnH/2 + 5);

    if (equipHover && game.mouseDown && !game.clickProcessed) {
      game.clickProcessed = true;
      equipFromBackpack(game.bpSelectedIndex);
      game.bpSelectedIndex = null;
    }
  }

  const discardBX = canEquip ? W/2 + 16 : W/2 - btnW/2;
  const discardHover = game.mouseX >= discardBX && game.mouseX <= discardBX + btnW && game.mouseY >= btnY && game.mouseY <= btnY + btnH;
  ctx.fillStyle = discardHover ? '#4a1a1a' : '#2a1a1a';
  ctx.strokeStyle = discardHover ? '#fff' : '#ff4444'; ctx.lineWidth = 2;
  roundRect(ctx, discardBX, btnY, btnW, btnH, 8);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#f88'; ctx.font = 'bold 14px sans-serif';
  ctx.fillText('丢弃', discardBX + btnW/2, btnY + btnH/2 + 5);

  if (discardHover && game.mouseDown && !game.clickProcessed) {
    game.clickProcessed = true;
    game.drops.push({...game.backpack[game.bpSelectedIndex], x: game.player.x + (Math.random()-0.5)*160, y: game.player.y + (Math.random()-0.5)*160, bobPhase: Math.random()*Math.PI*2});
    game.backpack.splice(game.bpSelectedIndex, 1);
    game.bpSelectedIndex = null;
    saveGame();
  }

  // Close hint
  ctx.fillStyle = '#666'; ctx.font = '10px sans-serif';
  ctx.fillText('点击空白区域关闭', W/2, py + panelH - 12);

  // Tap outside panel closes it (handled in processClick)
}
```

- [ ] **Step 4: Update processClick to close bottom panel when tapping outside**

In `js/gameplay.js`, in `processClick()`, before the backpack guard, add:

```js
// If backpack bottom panel is open and click is above the panel, close selection
if (game.showBackpack && game.bpSelectedIndex !== null) {
  const H = canvas.height;
  if (game.mouseY < H - 220) {
    game.bpSelectedIndex = null;
    game.clickProcessed = true;
    return;
  }
}
```

- [ ] **Step 5: Visual verification**

Open backpack on mobile view: verify 4-column grid, tap item shows bottom compare panel, equip/discard buttons work, tapping outside closes panel.

- [ ] **Step 6: Commit**

```bash
git add js/renderer.js js/gameplay.js js/game-state.js
git commit -m "feat: mobile portrait backpack with bottom compare panel

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 4: Menu, Death, Pause — Simple centering adaptations

**Files:**
- Modify: `js/renderer.js:45-107` (renderMenu), `js/renderer.js:1848-1863` (renderDeath), `js/renderer.js:1244-1293` (renderPauseMenu)

These screens are simple centered layouts. On mobile portrait, just adjust font sizes to be slightly larger (more room vertically) and ensure centering works. No structural changes.

- [ ] **Step 1: Adapt renderMenu for mobile**

Add mobile branch — increase font sizes for portrait readability:

```js
function renderMenu(){
  const W=canvas.width,H=canvas.height;
  const isMobile = 'ontouchstart' in window;
  ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);

  // Particles (same)
  for(let i=0;i<30;i++){
    const x=(Math.sin(Date.now()/1000+i)*0.5+0.5)*W;
    const y=(Math.cos(Date.now()/1500+i*2.3)*0.5+0.5)*H;
    ctx.fillStyle=`rgba(255,100,0,${0.05+Math.sin(Date.now()/2000+i)*0.05})`;
    ctx.beginPath();ctx.arc(x,y,2+Math.sin(Date.now()/1000+i*3)*1,0,Math.PI*2);ctx.fill();
  }

  ctx.textAlign='center';
  const titleSize = isMobile ? 52 : (W<400?36:64);
  ctx.font=`bold ${titleSize}px sans-serif`;
  ctx.fillStyle='#ff6b35';
  ctx.fillText('DIABLO LITE',W/2,H*0.3);

  const tagSize = isMobile ? 18 : (W<400?14:20);
  ctx.font=`${tagSize}px sans-serif`;
  ctx.fillStyle='#888';
  ctx.fillText('轻量版暗黑风刷怪游戏',W/2,H*0.3+50);

  const bw=isMobile?280:220, bh=isMobile?64:56;
  const bx=W/2-bw/2, by=H*0.45;
  menuButtons=[{x:bx,y:by,w:bw,h:bh,text:'开始游戏',action:()=>{game.screen='prepare';game.showBackpack=false;game.showPauseMenu=false;stopAmbient();}}];
  drawButton(bx,by,bw,bh,'开始游戏','#6b3a1a','#ff8c42','#ffd700');

  const smBW=isMobile?110:100, smBH=isMobile?36:32, smGap=14;
  const smBX=W/2-smBW-smGap/2, smBY=by+bh+24;
  const expHover=game.mouseX>=smBX&&game.mouseX<=smBX+smBW&&game.mouseY>=smBY&&game.mouseY<=smBY+smBH;
  ctx.fillStyle=expHover?'#2a3a2a':'#1a2a1a';
  ctx.strokeStyle=expHover?'#fff':'#4a4';ctx.lineWidth=1;
  roundRect(ctx,smBX,smBY,smBW,smBH,4);
  ctx.fill();ctx.stroke();
  ctx.fillStyle='#8f8';ctx.font='12px sans-serif';
  ctx.textAlign='center';
  ctx.fillText('导出存档',smBX+smBW/2,smBY+smBH/2+4);
  menuButtons.push({x:smBX,y:smBY,w:smBW,h:smBH,action:()=>{exportSave();}});

  const impBX=W/2+smGap/2;
  const impHover=game.mouseX>=impBX&&game.mouseX<=impBX+smBW&&game.mouseY>=smBY&&game.mouseY<=smBY+smBH;
  ctx.fillStyle=impHover?'#3a3a2a':'#2a2a1a';
  ctx.strokeStyle=impHover?'#fff':'#aa4';ctx.lineWidth=1;
  roundRect(ctx,impBX,smBY,smBW,smBH,4);
  ctx.fill();ctx.stroke();
  ctx.fillStyle='#ff8';ctx.font='12px sans-serif';
  ctx.fillText('导入存档',impBX+smBW/2,smBY+smBH/2+4);
  menuButtons.push({x:impBX,y:smBY,w:smBW,h:smBH,action:()=>{
    const inp=document.createElement('input');
    inp.type='file';inp.accept='.json';
    inp.onchange=async()=>{
      const file=inp.files[0];
      if(!file)return;
      try{
        await importSave(file);
        location.reload();
      }catch(e){
        alert('导入失败: '+e.message);
      }
    };
    inp.click();
  }});

  ctx.font='14px sans-serif';
  ctx.fillStyle='#555';
  ctx.fillText('v1.0',W/2,H*0.85);
}
```

**Key changes:** Title font 52px (was 36-64), tagline 18px (was 14-20), start button 280×64 (was 220×56), repositioned to H*0.45 center.

- [ ] **Step 2: Adapt renderDeath for mobile**

```js
function renderDeath(){
  const W=canvas.width,H=canvas.height;
  const isMobile = 'ontouchstart' in window;
  ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
  ctx.textAlign='center';

  const titleSize = isMobile ? 56 : 48;
  ctx.font='bold ' + titleSize + 'px sans-serif';
  ctx.fillStyle='#cc0000';
  ctx.fillText('你死了', W/2, H*0.3);

  const infoSize = isMobile ? 20 : 18;
  ctx.font=infoSize + 'px sans-serif';
  ctx.fillStyle='#ccc';
  ctx.fillText('击杀数: '+game.kills, W/2, H*0.4);
  ctx.fillText('等级: '+game.player.level, W/2, H*0.45);

  const bw=isMobile?260:200, bh=isMobile?56:50;
  const bx=W/2-bw/2, by=H*0.55;
  deathButtons=[{x:bx,y:by,w:bw,h:bh,text:'返回主菜单',action:()=>{game.screen='menu';game.showBackpack=false;game.showPauseMenu=false;startAmbient('menu');}}];
  drawButton(bx,by,bw,bh,'返回主菜单','#3a1a1a','#aaa','#ff4444');
}
```

- [ ] **Step 3: Adapt renderPauseMenu for mobile**

```js
export function renderPauseMenu(){
  const W=canvas.width,H=canvas.height;
  const isMobile = 'ontouchstart' in window;
  ctx.fillStyle='rgba(0,0,0,0.7)';
  ctx.fillRect(0,0,W,H);

  const pw=isMobile?400:300, ph=isMobile?260:200;
  const px=(W-pw)/2, py=(H-ph)/2;
  ctx.fillStyle='#1a1a2e';ctx.strokeStyle='#ff6b35';ctx.lineWidth=2;
  roundRect(ctx,px,py,pw,ph,10);
  ctx.fill();ctx.stroke();

  ctx.textAlign='center';
  const titleSize = isMobile ? 24 : 20;
  ctx.font='bold ' + titleSize + 'px sans-serif';
  ctx.fillStyle='#ff6b35';
  ctx.fillText('暂停',px+pw/2,py+45);

  const detailSize = isMobile ? 14 : 13;
  ctx.font=detailSize + 'px sans-serif';
  if (game.bossDefeated) {
    ctx.fillStyle='#aaa';
    ctx.fillText('确定要返回准备界面吗？',px+pw/2,py+85);
    ctx.fillStyle='#8f8';
    ctx.fillText('Boss 已击败，战利品保留',px+pw/2,py+108);
  } else {
    ctx.fillStyle='#f88';
    ctx.fillText('未击败 Boss，战利品将丢失！',px+pw/2,py+85);
    ctx.fillStyle='#aaa';
    ctx.fillText('确定要逃跑吗？',px+pw/2,py+108);
  }

  const bw=isMobile?130:100, bh=isMobile?42:36;
  const bx1=px+pw/2-bw-16, by=py+140;
  const bx2=px+pw/2+16;
  pauseButtons=[
    {x:bx1,y:by,w:bw,h:bh,action:()=>{
      game.showPauseMenu=false;
      if (!game.bossDefeated) game.backpack.length = 0;
      saveGame();
      game.screen='prepare';
      game.showBackpack=false; game.showPauseMenu=false;
      stopAmbient();
    }},
    {x:bx2,y:by,w:bw,h:bh,action:()=>{game.showPauseMenu=false;}},
  ];

  const h1=game.mouseX>=bx1&&game.mouseX<=bx1+bw&&game.mouseY>=by&&game.mouseY<=by+bh;
  ctx.fillStyle=h1?'#6a2a2a':'#4a1a1a';ctx.strokeStyle=h1?'#fff':'#f44';ctx.lineWidth=1;
  roundRect(ctx,bx1,by,bw,bh,6);ctx.fill();ctx.stroke();
  ctx.fillStyle='#f88';ctx.font='14px sans-serif';
  ctx.fillText('确认返回',bx1+bw/2,by+bh/2+5);

  const h2=game.mouseX>=bx2&&game.mouseX<=bx2+bw&&game.mouseY>=by&&game.mouseY<=by+bh;
  ctx.fillStyle=h2?'#3a3a4a':'#2a2a3a';ctx.strokeStyle=h2?'#fff':'#888';ctx.lineWidth=1;
  roundRect(ctx,bx2,by,bw,bh,6);ctx.fill();ctx.stroke();
  ctx.fillStyle='#ccc';ctx.font='14px sans-serif';
  ctx.fillText('取消',bx2+bw/2,by+bh/2+5);
}
```

- [ ] **Step 4: Visual verification**

Verify menu, death, and pause screens render correctly on mobile portrait.

- [ ] **Step 5: Commit**

```bash
git add js/renderer.js
git commit -m "feat: mobile portrait menu, death, and pause screen adaptations

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 5: Character Select & Testfield — Overlay adaptations

**Files:**
- Modify: `js/renderer.js:382-540` (renderCharSelect), `js/renderer.js:1867-1907` (renderTestField), `js/renderer.js:1964-2015` (renderDamageHUD), `js/renderer.js:2273-2290` (renderLoadoutToggle)

**Mobile layout:**
- Character select: wider dialog (800px vs 400px), full-height
- Testfield: equipment on left side, damage HUD bottom-left, loadout panel full-height
- Mostly parameter adjustments

- [ ] **Step 1: Adapt renderCharSelect for mobile**

In `renderCharSelect()`, increase dialog width and adjust heights for mobile:

```js
function renderCharSelect(){
  const W=canvas.width,H=canvas.height;
  const isMobile = 'ontouchstart' in window;
  ctx.fillStyle='rgba(0,0,0,0.7)';
  ctx.fillRect(0,0,W,H);

  const pw=isMobile?800:400, ph=isMobile?Math.min(800, H-80):Math.min(420,H-60);
  const px=(W-pw)/2, py=(H-ph)/2;
  // ... rest same, but itemH = isMobile ? 60 : 52
}
```

- [ ] **Step 2: Adapt renderTestField for mobile**

Equipment grid moves below game area instead of right side:

```js
function renderTestField() {
  const W = canvas.width, H = canvas.height;
  const isMobile = 'ontouchstart' in window;
  testfieldButtons = [];
  game.hoveredItem = null;

  // ... camera, background, grid, dummies, projectiles, etc. unchanged ...

  let testfieldEquipSlots = [];

  if (isMobile) {
    // Equipment grid below game area, use bottom portion
    const eqW = W - 20, eqH = 200;
    const eqX = 10, eqY = H - eqH - 60;
    renderEquipGrid(eqX, eqY, eqW, eqH, game.sandboxEquipment, testfieldEquipSlots, testfieldButtons);
    // Damage HUD bottom-left
    renderDamageHUD();
    // Loadout toggle top-left
    renderLoadoutToggle();
    if (game.showLoadoutPanel) renderLoadoutPanel();
    if (game.hoveredItem) renderCompareTooltip(game.hoveredItem);
    renderSlotPickerPopup();
  } else {
    // Desktop: equipment on right side
    const eqW = 290, eqH = 300;
    const eqX = W - eqW - 10, eqY = 50;
    renderEquipGrid(eqX, eqY, eqW, eqH, game.sandboxEquipment, testfieldEquipSlots, testfieldButtons);
    if (game.showLoadoutPanel) renderLoadoutPanel();
    renderLoadoutToggle();
    if (game.hoveredItem) renderCompareTooltip(game.hoveredItem);
    renderSlotPickerPopup();
  }
}
```

- [ ] **Step 3: Adapt renderLoadoutPanel for mobile (full-width)**

```js
function renderLoadoutPanel() {
  const W = canvas.width, H = canvas.height;
  const isMobile = 'ontouchstart' in window;
  const pw = isMobile ? W - 10 : 320;
  const ph = isMobile ? H - 60 : H - 80;
  const px = isMobile ? 5 : 10, py = isMobile ? 30 : 50;
  // ... rest of tab/panel rendering unchanged, just wider ...
}
```

- [ ] **Step 4: Visual verification**

Open character select, testfield on mobile view.

- [ ] **Step 5: Commit**

```bash
git add js/renderer.js
git commit -m "feat: mobile portrait character select and testfield adaptations

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 6: Victory Screen Cleanup (dead code — no changes)

**Files:**
- Modify: `js/renderer.js:1655` (renderVictory — add note, do not change)

Add a comment noting renderVictory is dead code (no setter for `game.screen = 'victory'`). No functional changes. This is documentation only.

- [ ] **Step 1: Add dead-code comment**

```js
// NOTE: renderVictory is dead code — no code path sets game.screen = 'victory'.
// Kept for reference; does not need mobile adaptation.
function renderVictory(){
```

- [ ] **Step 2: Commit**

```bash
git add js/renderer.js
git commit -m "chore: mark renderVictory as dead code

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 7: Final integration & edge case checks

**Files:**
- Modify: `js/renderer.js` (review all mobile branches)

- [ ] **Step 1: Ensure desktop layouts are unchanged**

Pass through each render function and verify the `else` or fallthrough path matches the original code exactly (before any mobile changes).

- [ ] **Step 2: Check game state cleanup on screen transitions**

In `js/gameplay.js`, ensure `game.bpSelectedIndex` and `game.prepareTab` are reset on screen transitions. Add where needed:

```js
// In screen transition functions:
game.bpSelectedIndex = null;
game.prepareTab = 'equip';
```

- [ ] **Step 3: Verify back button handling on mobile**

Mobile uses the HTML back/pause buttons. Verify `btnBackpack` tap works correctly when backpack bottom panel is open (should close panel first, then close backpack on second tap).

- [ ] **Step 4: Full visual test pass**

On mobile (or Chrome DevTools with touch emulation, 1080×1920 viewport):
1. Menu → start game → verify prepare screen with tabs
2. Switch tabs, verify equipment grid and stage list
3. Select stage → enter battle → verify HUD capsule + floating skill buttons
4. Open backpack → verify 4-col grid + bottom panel
5. Tap backpack item → verify compare panel + equip/discard
6. Pause → verify pause dialog
7. Die → verify death screen
8. Open character select → verify wide dialog
9. Enter testfield → verify layout

- [ ] **Step 5: Commit**

```bash
git add js/renderer.js js/gameplay.js
git commit -m "fix: mobile portrait integration and edge case handling

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```
