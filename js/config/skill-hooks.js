// ============================================================
// SKILL HOOKS — skill-modifying effects as data-driven callbacks
// ============================================================
// Each hook is an array of { id, condition, apply } objects.
//   id         unique identifier (for debugging)
//   condition  (ctx) => boolean — if false, skip this callback
//   apply      (state, ctx) => void — mutates the state object
//
// ctx provides: { fx, sets, player, equipment }
// state varies per hook (see each hook's schema comment)

export const SKILL_HOOKS = {
  // --- onTeleportCast ---
  // State: { cooldown: number, spawnEffects: [] }
  onTeleportCast: [
    {
      id: 'teleportCD_reduce',
      condition: (ctx) => ctx.fx.teleportCD > 0,
      apply: (state, ctx) => {
        state.cooldown = Math.max(0.5, state.cooldown - ctx.fx.teleportCD);
      },
    },
    {
      id: 'blackholeSize_teleport',
      condition: (ctx) => ctx.fx.blackholeSize > 0,
      apply: (state, ctx) => {
        const r = 120 * (1 + ctx.fx.blackholeSize / 100);
        state.spawnEffects.push({ type: 'blackhole', radius: r, duration: 1.5, pullForce: 120, damage: 5 });
      },
    },
  ],

  // --- onBlackholeCast ---
  // State: { radius: number, duration: number, tickDmg: number, spawnEffects: [] }
  onBlackholeCast: [
    {
      id: 'blackholeDur_extend',
      condition: (ctx) => ctx.fx.blackholeDur > 0,
      apply: (state, ctx) => { state.duration += ctx.fx.blackholeDur; },
    },
    {
      id: 'chronomancer2_radius',
      condition: (ctx) => ctx.sets.chronomancer && ctx.sets.chronomancer.active.two,
      apply: (state) => { state.radius = 220 * 1.3; },
    },
    {
      id: 'fireballDmg_blackhole',
      condition: (ctx) => ctx.fx.fireballDmg > 0,
      apply: (state, ctx) => {
        state.tickDmg = Math.round(state.tickDmg * (1 + ctx.fx.fireballDmg / 100));
      },
    },
    {
      id: 'chronomancer2_field',
      condition: (ctx) => ctx.sets.chronomancer && ctx.sets.chronomancer.active.two,
      apply: (state) => {
        state.spawnEffects.push({ type: 'singularitySpawn', radius: 220 });
      },
    },
  ],

  // --- onBlizzardCast ---
  // State: { radius: number, slowPct: number, tickDmg: number }
  onBlizzardCast: [
    {
      id: 'blizzardSize_expand',
      condition: (ctx) => ctx.fx.blizzardSize > 0,
      apply: (state, ctx) => {
        state.radius = Math.round(260 * (1 + ctx.fx.blizzardSize / 100));
      },
    },
    {
      id: 'blizzardSlow_boost',
      condition: (ctx) => ctx.fx.blizzardSlow > 0,
      apply: (state, ctx) => {
        state.slowPct = Math.min(0.5 * (1 + ctx.fx.blizzardSlow / 100), 0.9);
      },
    },
    {
      id: 'fireballDmg_blizzard',
      condition: (ctx) => ctx.fx.fireballDmg > 0,
      apply: (state, ctx) => {
        state.tickDmg = Math.round(state.tickDmg * (1 + ctx.fx.fireballDmg / 100));
      },
    },
  ],

  // --- onProjectileSpawn ---
  // State: { pierce: number }
  onProjectileSpawn: [
    {
      id: 'pierce_count',
      condition: (ctx) => ctx.fx.pierce > 0,
      apply: (state, ctx) => { state.pierce += ctx.fx.pierce; },
    },
  ],

  // --- onSingularitySpawn ---
  // State: { duration: number }
  onSingularitySpawn: [
    {
      id: 'fieldGenerator_duration',
      condition: (ctx) => {
        const art = ctx.equipment && ctx.equipment.artifact;
        return art && art.artifactId === 'fieldGenerator';
      },
      apply: (state) => { state.duration = 7; },
    },
  ],
};
