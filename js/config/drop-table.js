// ============================================================
// DROP TABLE — quality curves, affix pools, roll rules
// ============================================================
// Each quality row has a `condition` that filters availability.
//   condition: null = always available
//   condition: { type: 'minStage', value: N } = stage >= N required
// When a row's condition fails, it's excluded and weights renormalize.

export const QUALITY_CURVE = {
  normal: [
    { quality: 0, weight: 40, condition: null },
    { quality: 1, weight: 28, condition: null },
    { quality: 2, weight: 17, condition: null },
    { quality: 3, weight: 11, condition: null },
    { quality: 4, weight: 4,  condition: { type: 'minStage', value: 3 } },
  ],
  boss: [
    { quality: 2, weight: 40, condition: null },
    { quality: 3, weight: 42, condition: null },
    { quality: 4, weight: 18, condition: { type: 'minStage', value: 3 } },
  ],
};

// Affix pools — what can roll on each quality tier
export const AFFIX_POOLS = {
  stat: [
    { id: 'atk',          weight: 2 },
    { id: 'cdr',          weight: 1 },
    { id: 'maxHp',        weight: 2 },
    { id: 'bulletSpeed',  weight: 1 },
    { id: 'pickupRange',  weight: 1 },
    { id: 'movespeed',    weight: 1 },
  ],
  legendary: [
    { id: 'blackholeSize', weight: 2 },
    { id: 'pierce',        weight: 2 },
    { id: 'blizzardSize',  weight: 2 },
    { id: 'blackholeDur',  weight: 1 },
    { id: 'globalCDR',     weight: 2 },
    { id: 'fireballDmg',   weight: 2 },
    { id: 'blizzardSlow',  weight: 2 },
    { id: 'teleportCD',    weight: 1 },
    { id: 'ringElement',   weight: 1 },
  ],
};

// Weighted random selector with condition filtering
// ctx provides: { stageIdx, ... } for condition evaluation
export function weightedChoice(items, ctx) {
  // Filter by condition
  const available = items.filter(item => {
    if (!item.condition) return true;
    return evalCondition(item.condition, ctx);
  });

  const totalWeight = available.reduce((sum, item) => sum + item.weight, 0);
  let r = Math.random() * totalWeight;
  for (const item of available) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return available[available.length - 1];
}

function evalCondition(cond, ctx) {
  switch (cond.type) {
    case 'minStage': return (ctx.stageIdx || 0) >= cond.value;
    default: return true;
  }
}
