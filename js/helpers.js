// ============================================================
// SECTION 2: HELPERS
// ============================================================
export function dist(x1,y1,x2,y2){return Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1))}
export function angle(x1,y1,x2,y2){return Math.atan2(y2-y1,x2-x1)}
export function normalize(x,y){const l=Math.sqrt(x*x+y*y)||1;return{x:x/l,y:y/l}}
export function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
export function rand(min,max){return min+Math.random()*(max-min)}
export function randInt(min,max){return Math.floor(rand(min,max+1))}
export function randChoice(arr){return arr[Math.floor(Math.random()*arr.length)]}
export function lerp(a,b,t){return a+(b-a)*t}
export function formatTime(s){const m=Math.floor(s/60),sec=Math.floor(s%60);return String(m).padStart(2,'0')+':'+String(sec).padStart(2,'0')}
