// ============================================================
// SECTION 1: CONSTANTS & CONFIG
// ============================================================
import { clamp, rand, randChoice } from './helpers.js';
// Used locally AND re-exported below
import { QUALITY_NAMES, QUALITY_COLORS, QUALITY_MULT, SLOT_DEF, ARTIFACT_DEFS } from './config/equipment-table.js';
export { QUALITY_NAMES, QUALITY_COLORS, QUALITY_MULT, SLOT_DEF, ARTIFACT_DEFS };

export const MAP_W = 3000, MAP_H = 3000;
export const TILE_SIZE = 64;
export const PLAYER_RADIUS = 18;
export const MAX_PARTICLES = 500;
export const MAX_MONSTERS = 200;
export const BASE_FIRE_RATE = 2;
export const BASE_BULLET_SPEED = 200;
export const BASE_PICKUP_RANGE = 40;
export const DETECTION_RANGE = 400;
let _nextMonsterId = 1;
export function getNextMonsterId() { return _nextMonsterId++; }
export function resetMonsterId() { _nextMonsterId = 1; }

export const DIFFICULTY = [
  { power:1,    bossMult:3,   spawnRate:2.0, eliteEvery:40, killsBoss:40,  expMult:1,   desc:'1-70级 · 练级阶段', levelScale:true },
  { power:2,    bossMult:4,   spawnRate:1.5, eliteEvery:30, killsBoss:65,  expMult:1.8, desc:'1-70级 · 熟悉技能', levelScale:true },
  { power:4,    bossMult:6,   spawnRate:1.1, eliteEvery:22, killsBoss:90,  expMult:3,   desc:'1-70级 · 考验技巧', levelScale:true },
  { power:18,   bossMult:25,  spawnRate:1.0, eliteEvery:18, killsBoss:130, expMult:6,   desc:'秘境 80 层 · 需要Build', levelScale:false },
  { power:40,   bossMult:50,  spawnRate:0.85,eliteEvery:15, killsBoss:170, expMult:12,  desc:'秘境 90 层 · 装备成型', levelScale:false },
  { power:80,   bossMult:90,  spawnRate:0.7, eliteEvery:13, killsBoss:210, expMult:25,  desc:'秘境 100 层 · 普通毕业', levelScale:false },
  { power:150,  bossMult:160, spawnRate:0.55,eliteEvery:11, killsBoss:260, expMult:50,  desc:'秘境 115 层 · 高手', levelScale:false },
  { power:280,  bossMult:280, spawnRate:0.45,eliteEvery:9,  killsBoss:320, expMult:100, desc:'秘境 125 层 · 职业玩家', levelScale:false },
  { power:500,  bossMult:500, spawnRate:0.35,eliteEvery:7,  killsBoss:380, expMult:200, desc:'秘境 135 层 · 顶尖职业', levelScale:false },
  { power:900,  bossMult:900, spawnRate:0.25,eliteEvery:5,  killsBoss:500, expMult:400, desc:'秘境 150 层 · 几乎不可能', levelScale:false },
];

export const STAGES = [
  { name:'第一章', monsterTypes:['zombie'], bossType:'zombie' },
  { name:'第二章', monsterTypes:['zombie','skeleton'], bossType:'skeleton' },
  { name:'第三章', monsterTypes:['zombie','skeleton','ghost'], bossType:'ghost' },
  { name:'第四章', monsterTypes:['skeleton','ghost','exploder','spearman'], bossType:'deathKnight' },
  { name:'第五章', monsterTypes:['ghost','exploder','spearman','spider'], bossType:'deathKnight' },
  { name:'第六章', monsterTypes:['exploder','spearman','spider','shadowMage'], bossType:'spider' },
  { name:'第七章', monsterTypes:['spearman','spider','shadowMage','devourer'], bossType:'shadowMage' },
  { name:'第八章', monsterTypes:['spider','shadowMage','devourer','gargoyle'], bossType:'devourer' },
  { name:'第九章', monsterTypes:['shadowMage','devourer','gargoyle','deathKnight'], bossType:'gargoyle' },
  { name:'第十章', monsterTypes:['shadowMage','devourer','gargoyle','deathKnight'], bossType:'deathKnight' },
];

export const MONSTER_BASE = {
  zombie:{ color:'#556b2f', size:16, hp:30, speed:40, atk:5, exp:10 },
  skeleton:{ color:'#c0c0c0', size:16, hp:25, speed:60, atk:6, exp:12 },
  ghost:{ color:'#8a8aff', size:15, hp:20, speed:90, atk:4, exp:14 },
  exploder:{ color:'#ff4444', size:14, hp:18, speed:80, atk:5, exp:13 },
  spearman:{ color:'#44aa44', size:17, hp:28, speed:55, atk:7, exp:15 },
  spider:{ color:'#884422', size:14, hp:22, speed:65, atk:5, exp:11 },
  shadowMage:{ color:'#442266', size:16, hp:20, speed:60, atk:6, exp:16 },
  devourer:{ color:'#448844', size:20, hp:40, speed:35, atk:8, exp:18 },
  gargoyle:{ color:'#666644', size:18, hp:35, speed:50, atk:7, exp:17 },
  deathKnight:{ color:'#444466', size:19, hp:45, speed:55, atk:9, exp:20 },
};

export const SKILL_CONFIG = [
  { name:'传送', icon:'✦', baseCD:6, desc:'Teleport' },
  { name:'黑洞', icon:'⊙', baseCD:12, desc:'Black Hole' },
  { name:'暴雪', icon:'❄', baseCD:15, desc:'Blizzard' },
];

export const AFFIX_COLORS = { fast:'#ffd700', split:'#44ff44', explode:'#ff4444', vampiric:'#aa44ff', shielded:'#4488ff' };
export const MAX_LEVEL = 70;

export const TEST_DIFF = { power:0.3, bossMult:1, spawnRate:0.3, eliteEvery:8, killsBoss:15, expMult:50 };
export const TEST_STAGE = { name:'测试关卡', monsterTypes:['zombie','skeleton','ghost','exploder','spearman','spider','shadowMage','devourer','gargoyle','deathKnight'], bossType:'zombie' };

export const LEGENDARY_POWERS = [
  { name:'传送余震', desc:'传送后在原地留下黑洞(+{v}%范围)', min:30, max:80, stat:'blackholeSize' },
  { name:'穿透火球', desc:'火球穿透+{v}个敌人', min:1, max:4, stat:'pierce' },
  { name:'暴风眼', desc:'暴风雪范围+{v}%', min:20, max:60, stat:'blizzardSize' },
  { name:'黑洞吞噬', desc:'黑洞持续时间+{v}秒', min:0.5, max:2, stat:'blackholeDur' },
  { name:'冷却共鸣', desc:'所有技能冷却-{v}%', min:5, max:20, stat:'globalCDR' },
  { name:'火焰风暴', desc:'火球伤害+{v}%', min:15, max:50, stat:'fireballDmg' },
  { name:'急冻光环', desc:'暴风雪减速效果+{v}%', min:10, max:30, stat:'blizzardSlow' },
  { name:'虚空行者', desc:'传送冷却-{v}秒', min:1, max:4, stat:'teleportCD' },
  { name:'元素戒指', desc:'火/冰/奥每4s轮换，匹配时增伤+{v}%', min:50, max:150, stat:'ringElement' },
];

export const SET_DEFS = {
  elementalist: {
    name: '元素使', parts: ['bracers','belt','helmet','boots'],
    two: { desc: '元素印记', detail: '交替使用不同元素技能获得谐律层数，每层+15%技能伤害，重复归零' },
    three: { desc: '谐律爆发', detail: '3层时触发三色陨石AOE' },
    four: { desc: '谐律护体', detail: '每层+10%减伤，爆发后留元素光环(200px,+25%元素易伤)' },
  },
  chronomancer: {
    name: '时空术士', parts: ['bracers','belt','armor','ring'],
    two: { desc: '力场掌控', detail: '黑洞半径+30%，结束后留奇点力场(220px,4s,减速60%,+20%易伤)' },
    three: { desc: '坍缩奇点', detail: '力场上放暴风雪触发内爆AOE' },
    four: { desc: '时空大师', detail: '站力场内2s重置传送CD，坍缩后全技能-3s CD' },
  },
};

export const SYNERGY_DEFS = [
  {
    id: 'moltenCore', name: '熔火之心',
    requires: ['pierce','fireballDmg'],
    desc: '火球每穿透一个敌人伤害+10%。穿透≥3点燃目标(3s,ATK×0.5/s)',
  },
  {
    id: 'deepFrost', name: '深寒领域',
    requires: ['blizzardSize','blizzardSlow'],
    desc: '暴风雪内减速>70%的敌人冻结1.5s(每4s一次)',
  },
  {
    id: 'fireIce', name: '火冰相激',
    requires: ['pierce','blizzardSize'],
    desc: '火球穿过暴风雪区域获得冰火双属性，对冻结目标伤害×2',
  },
  {
    id: 'temporalResonance', name: '时空共鸣',
    requires: ['globalCDR','teleportCD'],
    desc: '传送后2s内下一个非传送技能CD减半',
  },
];

export function rollLegendaryPower(ilvl){
  const p={...randChoice(LEGENDARY_POWERS)};
  const frac=(ilvl-1)/69;
  p.value=Math.round(p.min + (p.max-p.min)*frac*(0.5+Math.random()*0.5));
  p.value=clamp(p.value,p.min,p.max);
  return p;
}
