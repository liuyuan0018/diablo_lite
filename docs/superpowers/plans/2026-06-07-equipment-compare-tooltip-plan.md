# Equipment Compare Tooltip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the click-to-view item detail popup with a hover-triggered side-by-side comparison tooltip on victory and backpack screens.

**Architecture:** Single new rendering function `renderCompareTooltip()` draws a fixed right-side panel comparing equipped vs hovered item stats. Victory screen item cells gain direct click actions (pickup/put back) instead of opening a modal. The `game.viewingItem` state is replaced by `game.hoveredItem`.

**Tech Stack:** HTML5 Canvas, vanilla JavaScript, single-file `index.html`

---

### Task 1: Add hover tracking state and comparison rendering function

**Files:**
- Modify: `D:\claw\projects\diablo_lite\index.html`

- [ ] **Step 1: Add `game.hoveredItem` state**

Replace the old `viewingItem:null` in the game state object (line ~174):

```javascript
// OLD (line 174):
viewingItem:null,

// NEW:
hoveredItem:null,
```

- [ ] **Step 2: Add `renderCompareTooltip()` function**

Insert before `renderVictory()` (before line 2037), add the new function:

```javascript
function renderCompareTooltip(hoveredItem){
  if(!hoveredItem)return;
  const W=canvas.width,H=canvas.height;
  const slot=hoveredItem.slot;
  const equipped=game.equipment[slot];
  const statDesc={atk:'攻击力',cdr:'冷却缩减',maxHp:'最大生命',bulletSpeed:'弹道速度',pickupRange:'拾取范围',movespeed:'移动速度'};
  const slotNames={weapon:'武器',helmet:'头盔',armor:'护甲',ring:'戒指',amulet:'项链',boots:'靴子'};

  const tw=520,th=240;
  const tx=W-tw-16,ty=H/2-th/2;

  // Background
  ctx.fillStyle='rgba(10,10,20,0.94)';
  ctx.strokeStyle='#ffd700';ctx.lineWidth=2;
  roundRect(ctx,tx,ty,tw,th,8);
  ctx.fill();ctx.stroke();

  // Title bar
  ctx.fillStyle='#ffd700';
  ctx.font='bold 13px sans-serif';
  ctx.textAlign='center';
  ctx.fillText('◀ 当前装备',tx+tw*0.25,ty+22);
  ctx.fillText('悬停物品 ▶',tx+tw*0.75,ty+22);
  ctx.fillStyle='#444';
  ctx.fillText('|',tx+tw/2,ty+22);
  ctx.fillStyle='#888';
  ctx.font='11px sans-serif';
  ctx.fillText(slotNames[slot]||slot,tx+tw/2,ty+22);

  // Divider line
  ctx.strokeStyle='#333';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(tx+tw/2,ty+30);ctx.lineTo(tx+tw/2,ty+th-12);ctx.stroke();

  // === LEFT: Current equipped ===
  const lx=tx+12,ly=ty+38,lw=tw/2-24;
  if(equipped){
    ctx.fillStyle=QUALITY_COLORS[equipped.quality]||'#aaa';
    ctx.font='bold 12px sans-serif';
    ctx.fillText(equipped.name,lx+lw/2,ly+16);
    ctx.fillStyle='#888';ctx.font='10px sans-serif';
    ctx.fillText('Lv.'+equipped.ilvl+' · '+QUALITY_NAMES[equipped.quality],lx+lw/2,ly+34);
    ctx.fillStyle='#ccc';ctx.font='12px sans-serif';
    ctx.fillText((statDesc[equipped.stat]||'')+' +'+equipped.statValue,lx+lw/2,ly+54);
    if(equipped.power){
      ctx.fillStyle='#ff6600';ctx.font='10px sans-serif';
      ctx.fillText('★ '+equipped.power.desc.replace('{v}',equipped.power.value),lx+lw/2,ly+72);
    }else{
      ctx.fillStyle='#444';ctx.font='10px sans-serif';
      ctx.fillText('(无传奇词缀)',lx+lw/2,ly+72);
    }
  }else{
    ctx.fillStyle='#555';ctx.font='13px sans-serif';
    ctx.fillText('（空槽位）',lx+lw/2,ly+40);
  }

  // === RIGHT: Hovered item ===
  const rx=tx+tw/2+12,ry=ty+38,rw=tw/2-24;
  ctx.fillStyle=QUALITY_COLORS[hoveredItem.quality]||'#aaa';
  ctx.font='bold 12px sans-serif';
  ctx.fillText(hoveredItem.name,rx+rw/2,ry+16);
  ctx.fillStyle='#888';ctx.font='10px sans-serif';
  ctx.fillText('Lv.'+hoveredItem.ilvl+' · '+QUALITY_NAMES[hoveredItem.quality],rx+rw/2,ry+34);

  // Stat comparison
  if(equipped){
    const hVal=hoveredItem.statValue;
    const eVal=equipped.statValue;
    const diff=hVal-eVal;
    if(diff>0){
      ctx.fillStyle='#44ff44';ctx.font='bold 12px sans-serif';
      ctx.fillText((statDesc[hoveredItem.stat]||'')+' +'+hVal+' ↑(+'+diff+')',rx+rw/2,ry+54);
    }else if(diff<0){
      ctx.fillStyle='#ff4444';ctx.font='bold 12px sans-serif';
      ctx.fillText((statDesc[hoveredItem.stat]||'')+' +'+hVal+' ↓('+diff+')',rx+rw/2,ry+54);
    }else{
      ctx.fillStyle='#ccc';ctx.font='12px sans-serif';
      ctx.fillText((statDesc[hoveredItem.stat]||'')+' +'+hVal,rx+rw/2,ry+54);
    }
  }else{
    ctx.fillStyle='#ffd700';ctx.font='bold 12px sans-serif';
    ctx.fillText((statDesc[hoveredItem.stat]||'')+' +'+hoveredItem.statValue+' ✦新',rx+rw/2,ry+54);
  }

  // Legendary power comparison
  if(hoveredItem.power){
    const hp=hoveredItem.power;
    const ep=equipped&&equipped.power;
    if(ep){
      if(hp.stat===ep.stat&&hp.value!==ep.value){
        const pd=hp.value-ep.value;
        if(pd>0){
          ctx.fillStyle='#44ff44';ctx.font='bold 10px sans-serif';
          ctx.fillText('★ '+hp.desc.replace('{v}',hp.value)+' ↑',rx+rw/2,ry+72);
        }else{
          ctx.fillStyle='#ff4444';ctx.font='bold 10px sans-serif';
          ctx.fillText('★ '+hp.desc.replace('{v}',hp.value)+' ↓',rx+rw/2,ry+72);
        }
      }else if(hp.stat===ep.stat){
        ctx.fillStyle='#ff6600';ctx.font='10px sans-serif';
        ctx.fillText('★ '+hp.desc.replace('{v}',hp.value)+' (=)',rx+rw/2,ry+72);
      }else{
        ctx.fillStyle='#ffaa00';ctx.font='10px sans-serif';
        ctx.fillText('★ '+hp.desc.replace('{v}',hp.value)+' (不同词缀)',rx+rw/2,ry+72);
      }
    }else{
      ctx.fillStyle='#ffd700';ctx.font='bold 10px sans-serif';
      ctx.fillText('★ '+hp.desc.replace('{v}',hp.value)+' ✦新词缀',rx+rw/2,ry+72);
    }
  }else if(equipped&&equipped.power){
    ctx.fillStyle='#884444';ctx.font='10px sans-serif';
    ctx.fillText('(失去传奇词缀)',rx+rw/2,ry+72);
  }
}
```

---

### Task 2: Modify victory screen — replace popup with hover + direct clicks

**Files:**
- Modify: `D:\claw\projects\diablo_lite\index.html:2034-2205`

- [ ] **Step 1: Remove the entire `game.viewingItem` popup block (lines 2135-2198)**

Replace:
```javascript
  // === Detail Popup ===
  if(game.viewingItem){
    const vi=game.viewingItem;
    const item=vi.item;
    if(!item){game.viewingItem=null;return;}
    // ... (entire popup block through line 2197)
    return;
  }
```

With:
```javascript
  // === Compare Tooltip ===
  if(game.hoveredItem){
    renderCompareTooltip(game.hoveredItem);
  }
```

- [ ] **Step 2: Change ground item hover to set `game.hoveredItem` and add direct click action**

In the ground items loop (lines 2089-2091), replace:
```javascript
      if(hover){
        victoryButtons.push({x:cx,y:cy,w:cellW,h:cellH,idx:i,action:()=>{game.viewingItem={item:ground[i],source:'ground',idx:i};}});
      }
```

With:
```javascript
      if(hover){
        game.hoveredItem=ground[i];
        victoryButtons.push({x:cx,y:cy,w:cellW,h:cellH,text:'pickupGround',idx:i,action:()=>{pickupGroundItem(i);}});
      }
```

- [ ] **Step 3: Change backpack item hover to set `game.hoveredItem` and add direct put-back action**

In the backpack items loop (lines 2129-2131), replace:
```javascript
      if(hover){
        victoryButtons.push({x:cx,y:cy,w:cellW,h:cellH,idx:i,action:()=>{game.viewingItem={item:game.backpack[i],source:'backpack',idx:i};}});
      }
```

With:
```javascript
      if(hover){
        game.hoveredItem=item;
        victoryButtons.push({x:cx,y:cy,w:cellW,h:cellH,text:'putBack',idx:i,action:()=>{
          game.drops.push({...game.backpack[i],bobPhase:Math.random()*Math.PI*2,expireTime:null});
          game.backpack.splice(i,1);
        }});
      }
```

- [ ] **Step 4: Update the ground/backpack section titles**

Change line 2062 from:
```javascript
  ctx.fillText('地面战利品 ('+ground.length+'件) — 点击查看详情',W/2,topY);
```
To:
```javascript
  ctx.fillText('地面战利品 ('+ground.length+'件) — 悬停对比 · 点击拾取',W/2,topY);
```

Change line 2101 from:
```javascript
  ctx.fillText('背包 ('+bp.length+'/8) — 点击查看详情',W/2,bpY+12);
```
To:
```javascript
  ctx.fillText('背包 ('+bp.length+'/8) — 悬停对比 · 点击放回地面',W/2,bpY+12);
```

- [ ] **Step 5: Reset `game.hoveredItem` at start of `renderVictory()`**

After `victoryButtons=[];` (line 2051), add:
```javascript
  game.hoveredItem=null;
```

---

### Task 3: Add hover comparison to backpack overlay

**Files:**
- Modify: `D:\claw\projects\diablo_lite\index.html:1813-1924`

- [ ] **Step 1: Track hovered item in backpack item loop**

In the backpack items loop, after `if(hover)hoveredSlot=item.slot;` (line 1852), add:
```javascript
      if(hover)game.hoveredItem=item;
```

- [ ] **Step 2: Add `renderCompareTooltip()` call at end of `renderBackpackOverlay()`**

After the equipment panel section (after line 1923, before the closing `}` of the function), add:
```javascript
  if(game.hoveredItem){
    renderCompareTooltip(game.hoveredItem);
  }
```

- [ ] **Step 3: Reset `game.hoveredItem` at start of `renderBackpackOverlay()`**

After line 1816 (`ctx.fillRect(0,0,W,H);`), add:
```javascript
  game.hoveredItem=null;
```

---

### Task 4: Update click handling to remove `game.viewingItem` references

**Files:**
- Modify: `D:\claw\projects\diablo_lite\index.html:2473-2483`

- [ ] **Step 1: Remove `viewingItem` logic from click handler**

Replace lines 2473-2483:
```javascript
  }else if(game.screen==='victory'){
    if(game.viewingItem){
      for(let i=victoryButtons.length-1;i>=0;i--){
        const b=victoryButtons[i];
        if(!b.action||b.text==='outside')continue;
        if(game.mouseX>=b.x&&game.mouseX<=b.x+b.w&&game.mouseY>=b.y&&game.mouseY<=b.y+b.h){b.action();return;}
      }
      game.viewingItem=null;
    }else{
      checkButtonClicks(victoryButtons);
    }
```

With:
```javascript
  }else if(game.screen==='victory'){
    checkButtonClicks(victoryButtons);
```

---

### Task 5: Verification — test all interaction flows

- [ ] **Step 1: Start a local server and open the game**

```bash
cd D:\claw\projects\diablo_lite && python server.py
```

Open `http://localhost:8000` in browser.

- [ ] **Step 2: Test victory screen flow**
  1. Enter test stage (press backtick `)
  2. Kill boss to reach victory screen
  3. Hover ground items → verify comparison tooltip shows on right side
  4. Click ground item → verify it moves to backpack
  5. Hover backpack item → verify comparison tooltip shows
  6. Click backpack item → verify it returns to ground
  7. Verify no modal popup blocking the screen

- [ ] **Step 3: Test backpack overlay flow**
  1. Press B to open backpack
  2. Hover an item → verify comparison tooltip shows
  3. Click item → verify it equips (prepare screen) or shows discard X (combat)
  4. Press B to close

- [ ] **Step 4: Verify stat comparison visuals**
  1. Equip a low-stat item in a slot
  2. Find/hover a higher-stat item for same slot → verify green ↑(+N)
  3. Find/hover a lower-stat item → verify red ↓(-N)
  4. Empty a slot → hover item for that slot → verify gold ✦新
  5. Test legendary power comparison (same power diff value, different power, etc.)
