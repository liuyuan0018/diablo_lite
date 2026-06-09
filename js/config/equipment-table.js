// ============================================================
// EQUIPMENT TABLE — slot definitions, quality tiers, artifacts, name formatting
// ============================================================

// Quality tiers
export const QUALITY_NAMES = ['普通','魔法','稀有','传说','套装'];
export const QUALITY_COLORS = ['#aaaaaa','#4488ff','#ffd700','#ff6600','#44ff44'];
export const QUALITY_MULT = [1, 1.4, 1.9, 2.5, 2.5];

// Per-quality affix slot count (future use — drop table will consume this)
export const QUALITY_AFFIX_SLOTS = {
  0: { statSlots: 0, legendarySlots: 0 },
  1: { statSlots: 1, legendarySlots: 0 },
  2: { statSlots: 1, legendarySlots: 0 },
  3: { statSlots: 1, legendarySlots: 1 },
  4: { statSlots: 0, legendarySlots: 0 },
};

// Slot definitions — keyed by slot name for backward compatibility
export const SLOT_DEF = {
  weapon:  { stat:'atk',          name:'武器', base:10, desc:'攻击力' },
  helmet:  { stat:'cdr',          name:'头盔', base:3,  desc:'冷却缩减' },
  armor:   { stat:'maxHp',        name:'护甲', base:25, desc:'最大生命' },
  ring:    { stat:'bulletSpeed',  name:'戒指', base:30, desc:'弹道速度' },
  amulet:  { stat:'pickupRange',  name:'项链', base:12, desc:'拾取范围' },
  boots:   { stat:'movespeed',    name:'靴子', base:0,  desc:'移动速度', legendary:true },
  bracers: { stat:'atk',          name:'护腕', base:8,  desc:'攻击力' },
  belt:    { stat:'maxHp',        name:'腰带', base:20, desc:'最大生命' },
  artifact:{ stat:'artifact',     name:'法器', base:0,  desc:'特殊效果', legendary:true },
};

// Artifact definitions
export const ARTIFACT_DEFS = [
  { id:'harmonyEye',      name:'谐律之眼', setName:'elementalist', desc:'谐律爆发追踪单体，伤害+50%范围缩小' },
  { id:'fieldGenerator',  name:'力场发生器', setName:'chronomancer', desc:'力场持续+3s，不被坍缩消耗' },
  { id:'feather',         name:'缓落之羽', setName:null,           desc:'HP>80%时技能伤害+25%移速+20%' },
  { id:'criticalFragment',name:'临界碎片', setName:null,           desc:'任一技能CD<3s时所有技能伤害+30%' },
];

// Name formatting — all name construction in one place
export function formatItemName(quality, slotName, setOrArtifactName, ilvl) {
  const qName = QUALITY_NAMES[Math.min(quality, 3)];
  if (quality === 4) {
    return QUALITY_NAMES[4] + ' ' + setOrArtifactName + ' ' + slotName + ' [' + ilvl + ']';
  }
  if (setOrArtifactName) {
    return qName + setOrArtifactName + ' [' + ilvl + ']';
  }
  return qName + slotName + ' [' + ilvl + ']';
}
