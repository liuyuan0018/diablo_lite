// ============================================================
// SECTION 1: CONSTANTS & CONFIG
// ============================================================
import { clamp, rand, randChoice } from './helpers.js';

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
  { power:1,    bossMult:3,   spawnRate:2.0, eliteEvery:40, killsBoss:40,  expMult:1,   desc:'1-70级 · 练级阶段' },
  { power:2.5,  bossMult:5,   spawnRate:1.5, eliteEvery:30, killsBoss:65,  expMult:1.8, desc:'1-70级 · 熟悉技能' },
  { power:5.5,  bossMult:8,   spawnRate:1.1, eliteEvery:22, killsBoss:90,  expMult:3,   desc:'1-70级 · 考验技巧' },
  { power:10,   bossMult:15,  spawnRate:1.0, eliteEvery:18, killsBoss:130, expMult:6,   desc:'秘境 80 层 · 需要Build' },
  { power:22,   bossMult:28,  spawnRate:0.85,eliteEvery:15, killsBoss:170, expMult:12,  desc:'秘境 90 层 · 装备成型' },
  { power:45,   bossMult:50,  spawnRate:0.7, eliteEvery:13, killsBoss:210, expMult:25,  desc:'秘境 100 层 · 普通毕业' },
  { power:85,   bossMult:90,  spawnRate:0.55,eliteEvery:11, killsBoss:260, expMult:50,  desc:'秘境 115 层 · 高手' },
  { power:160,  bossMult:160, spawnRate:0.45,eliteEvery:9,  killsBoss:320, expMult:100, desc:'秘境 125 层 · 职业玩家' },
  { power:300,  bossMult:300, spawnRate:0.35,eliteEvery:7,  killsBoss:380, expMult:200, desc:'秘境 135 层 · 顶尖职业' },
  { power:600,  bossMult:600, spawnRate:0.25,eliteEvery:5,  killsBoss:500, expMult:400, desc:'秘境 150 层 · 几乎不可能' },
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

export const QUALITY_NAMES = ['普通','魔法','稀有','传说'];
export const QUALITY_COLORS = ['#aaaaaa','#4488ff','#ffd700','#ff6600'];
export const QUALITY_MULT = [1, 1.4, 1.9, 2.5];
export const AFFIX_COLORS = { fast:'#ffd700', split:'#44ff44', explode:'#ff4444', vampiric:'#aa44ff', shielded:'#4488ff' };
export const MAX_LEVEL = 70;

export const TEST_DIFF = { power:0.3, bossMult:1, spawnRate:0.3, eliteEvery:8, killsBoss:15, expMult:50 };
export const TEST_STAGE = { name:'测试关卡', monsterTypes:['zombie','skeleton','ghost','exploder','spearman','spider','shadowMage','devourer','gargoyle','deathKnight'], bossType:'zombie' };

export const SLOT_DEF = {
  weapon:{ stat:'atk', name:'武器', base:10, desc:'攻击力' },
  helmet:{ stat:'cdr', name:'头盔', base:3, desc:'冷却缩减' },
  armor:{ stat:'maxHp', name:'护甲', base:25, desc:'最大生命' },
  ring:{ stat:'bulletSpeed', name:'戒指', base:30, desc:'弹道速度' },
  amulet:{ stat:'pickupRange', name:'项链', base:12, desc:'拾取范围' },
  boots:{ stat:'movespeed', name:'靴子', base:0, desc:'移动速度', legendary:true },
};

export const LEGENDARY_POWERS = [
  { name:'传送余震', desc:'传送后在原地留下黑洞(+{v}%范围)', min:30, max:80, stat:'blackholeSize' },
  { name:'穿透火球', desc:'火球穿透+{v}个敌人', min:1, max:4, stat:'pierce' },
  { name:'暴风眼', desc:'暴风雪范围+{v}%', min:20, max:60, stat:'blizzardSize' },
  { name:'黑洞吞噬', desc:'黑洞持续时间+{v}秒', min:0.5, max:2, stat:'blackholeDur' },
  { name:'冷却共鸣', desc:'所有技能冷却-{v}%', min:5, max:20, stat:'globalCDR' },
  { name:'火焰风暴', desc:'火球伤害+{v}%', min:15, max:50, stat:'fireballDmg' },
  { name:'急冻光环', desc:'暴风雪减速效果+{v}%', min:10, max:30, stat:'blizzardSlow' },
  { name:'虚空行者', desc:'传送冷却-{v}秒', min:1, max:4, stat:'teleportCD' },
];

export function ilvlFactor(ilv){ return 0.35 + ilv*0.0236; }

export function rollIlvl(stageIdx){
  if(stageIdx>=3)return 70;
  const ranges=[[1,15],[8,22],[15,30]];
  const r=ranges[stageIdx]||ranges[0];
  return Math.floor(rand(r[0],r[1]+1));
}

export function rollStatValue(slot,quality,ilvl){
  const def=SLOT_DEF[slot];
  if(!def||def.base===0)return 0;
  const base=def.base*ilvlFactor(ilvl)*QUALITY_MULT[quality];
  const v=base*(0.75+Math.random()*0.5);
  return Math.round(v);
}

export function rollLegendaryPower(ilvl){
  const p={...randChoice(LEGENDARY_POWERS)};
  const frac=(ilvl-1)/69;
  p.value=Math.round(p.min + (p.max-p.min)*frac*(0.5+Math.random()*0.5));
  p.value=clamp(p.value,p.min,p.max);
  return p;
}
