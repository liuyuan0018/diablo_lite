// ============================================================
// BUFF TABLE — every stat-affecting effect in the game
// ============================================================
// Schema per buff row:
//   id         unique key
//   name       display name (buff bar chip)
//   color      chip color
//   detail     short detail text for chip
//   hidden     true = skip buff bar (raw equip stats)
//   condition  { type, ...params } | null = always active
//   effects    [{ attr, op: 'add'|'mul', value: number|expression }]
//              expressions support ${value} (rolled power value)
//              and ${stacks} (player.elementalistStacks)

// === TYPE 1: Equipment stat bonuses (hidden — raw stat additions) ===

export const STAT_BUFF_MAP = {
  atk:          { id: 'stat_atk',          name: '攻击', color: '#ccc', detail: '', hidden: true },
  cdr:          { id: 'stat_cdr',          name: '冷却', color: '#ccc', detail: '', hidden: true },
  maxHp:        { id: 'stat_maxHp',        name: '生命', color: '#ccc', detail: '', hidden: true },
  bulletSpeed:  { id: 'stat_bulletSpeed',  name: '弹速', color: '#ccc', detail: '', hidden: true },
  pickupRange:  { id: 'stat_pickupRange',  name: '拾取', color: '#ccc', detail: '', hidden: true },
  movespeed:    { id: 'stat_movespeed',     name: '移速', color: '#ccc', detail: '', hidden: true },
};

// === TYPE 2: Legendary power stat effects ===
// Values use ${value} which is replaced at runtime with the rolled power value.

export const LEGENDARY_BUFF_DEFS = [
  {
    id: 'fireballDmg',
    name: '火焰风暴',
    color: '#ff4400',
    detail: '增伤',
    hidden: false,
    condition: null,
    effects: [], // applied manually in calcPlayerStats — only affects bATK, not baseATK
  },
  {
    id: 'globalCDR',
    name: '冷却共鸣',
    color: '#4488ff',
    detail: 'CDR',
    hidden: false,
    condition: null,
    effects: [
      { attr: 'cdr', op: 'add', value: '${value}' },
    ],
  },
];

// === TYPE 3: Artifact conditional stat buffs ===
// Re-evaluated each calcPlayerStats call. condition fails → effect not applied.

export const ARTIFACT_BUFF_DEFS = [
  {
    id: 'feather',
    name: '缓落',
    color: '#ffcc44',
    detail: '增伤',
    hidden: false,
    condition: { type: 'hpAbovePct', threshold: 80 },
    effects: [
      { attr: 'atk', op: 'mul', value: 0.25 },
      { attr: 'moveMult', op: 'mul', value: 0.20 },
    ],
  },
  {
    id: 'criticalFragment',
    name: '临界',
    color: '#ff6644',
    detail: '增伤',
    hidden: false,
    condition: { type: 'anySkillCdBelow', threshold: 3 },
    effects: [
      { attr: 'atk', op: 'mul', value: 0.30 },
    ],
  },
];

// === TYPE 4: Set stat buffs ===
// These are created per set-equipped item. The buff engine deduplicates
// by evaluating set count: if set count < required, condition fails.
// Values use ${stacks} which is replaced at runtime with player.elementalistStacks.

export const SET_BUFF_DEFS = [
  {
    id: 'elementalist_dmg',
    name: '谐律印记',
    color: '#44ff44',
    detail: '套装',
    hidden: false,
    condition: { type: 'setCount', setName: 'elementalist', minCount: 2 },
    effects: [
      { attr: 'atk', op: 'mul', value: '${stacks} * 0.15' },
    ],
  },
  {
    id: 'elementalist_dr',
    name: '谐律护体',
    color: '#44ff44',
    detail: '减伤',
    hidden: false,
    condition: { type: 'setCount', setName: 'elementalist', minCount: 4 },
    effects: [
      { attr: 'dmgReduc', op: 'add', value: '${stacks} * 0.10' },
    ],
  },
];

// === TYPE 5: Skill-granted timed buffs ===
// Effects handled directly in game code (damagePlayer, etc).
// Buff engine manages lifecycle (add, tick, remove) and buff bar display.

export const SKILL_BUFF_DEFS = [
  {
    id: 'ghost',
    name: '幽灵',
    color: '#8888ff',
    detail: '减伤',
    hidden: false,
    condition: null,
    remove: { type: 'duration', seconds: 2 },
    effects: [], // handled in damagePlayer via hasBuff('ghost')
  },
];

// === TYPE 6: Synergy stat effects ===
// All synergies are skill-modifying (pierce, ignite, freeze, etc.),
// not stat-modifying. This table exists for future migration.

export const SYNERGY_BUFF_DEFS = [];

// === AGGREGATE ===

export const ALL_BUFF_DEFS = [
  ...LEGENDARY_BUFF_DEFS,
  ...ARTIFACT_BUFF_DEFS,
  ...SET_BUFF_DEFS,
  ...SKILL_BUFF_DEFS,
  ...SYNERGY_BUFF_DEFS,
];
