/**
 * Generador de arte procedural de Eclipsia (placeholder hasta tener ilustraciones finales).
 * Cada carta produce siempre la misma imagen a partir de su id (semilla).
 * Uso en navegador:  import { paint } from './art.js'; img.src = paint('s1','sol','c');
 * kind: 'c' criatura (constelación), 'h' hechizo (sello), 'hero' retrato.
 * Para otros motores: reproducir las mismas capas (ver docs/08-sistema-de-diseno.md § Arte) o usar las PNG exportadas.
 */
export const FAC={
  sol:{n:'Sol',c:'#f08a3c',d:'#5a2414',k:'#2a1020',id:'S',desc:'Agresiva: daño directo, Furia y fuerza de Día.'},
  marea:{n:'Marea',c:'#4cc3c9',d:'#0f3a4a',k:'#0b1a2e',id:'M',desc:'Control: guardianes, curación y robo de cartas.'},
  raiz:{n:'Raíz',c:'#8cc152',d:'#26401f',k:'#121e17',id:'R',desc:'Enjambre: muchas criaturas y refuerzos.'},
  umbra:{n:'Umbra',c:'#b184f0',d:'#2e1d4d',k:'#120d22',id:'U',desc:'Noche: veneno, robo vital y pactos de sangre.'},
  neutral:{n:'Neutral',c:'#c9bfa8',d:'#3a3530',k:'#1c1a1f',id:'N',desc:'Cartas que entran en cualquier mazo.'}
};
function hash(s){let h=2166136261;for(const ch of s){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function hexA(h,a){const n=parseInt(h.slice(1),16);return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`}
export function paint(id,f,kind){
  const W=240,H=180,cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d');
  const R=rng(hash(id)),F=FAC[f];
  let g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,F.d);g.addColorStop(1,F.k);x.fillStyle=g;x.fillRect(0,0,W,H);
  x.fillStyle='#fff';for(let i=0;i<70;i++){x.globalAlpha=.08+R()*.5;const s=.4+R()*1.4;x.fillRect(R()*W,R()*H,s,s)}x.globalAlpha=1;
  const cx=W*(.28+R()*.44),cy=H*(.24+R()*.28);
  if(f==='sol'){
    const r=20+R()*20,rg=x.createRadialGradient(cx,cy,1,cx,cy,r*3.2);rg.addColorStop(0,'rgba(255,226,170,1)');rg.addColorStop(.3,hexA(F.c,.6));rg.addColorStop(1,'rgba(0,0,0,0)');
    x.fillStyle=rg;x.fillRect(0,0,W,H);x.strokeStyle='rgba(255,214,150,.45)';x.lineWidth=1.4;
    const n=12+(R()*14|0);for(let i=0;i<n;i++){const a=i/n*6.283+R()*.15,l=r*(1.4+R()*1.7);x.beginPath();x.moveTo(cx+Math.cos(a)*r*1.1,cy+Math.sin(a)*r*1.1);x.lineTo(cx+Math.cos(a)*l,cy+Math.sin(a)*l);x.stroke()}
    x.fillStyle='#fff1d6';x.beginPath();x.arc(cx,cy,r*.62,0,7);x.fill();
    const p=R()*6;x.fillStyle='rgba(42,16,32,.9)';x.beginPath();x.moveTo(0,H);for(let xx=0;xx<=W;xx+=6)x.lineTo(xx,H*.84+Math.sin(xx/38+p)*7);x.lineTo(W,H);x.fill();
  }else if(f==='marea'){
    const mg=x.createRadialGradient(cx,cy*.8,1,cx,cy*.8,70);mg.addColorStop(0,'rgba(220,250,255,.9)');mg.addColorStop(.14,'rgba(160,230,240,.35)');mg.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=mg;x.fillRect(0,0,W,H);
    for(let k=0;k<7;k++){const y0=H*.46+k*13,p=R()*6,fr=14+k*4+R()*6,am=4+k*1.4;x.beginPath();x.moveTo(0,H);for(let xx=0;xx<=W;xx+=5)x.lineTo(xx,y0+Math.sin(xx/fr+p)*am);x.lineTo(W,H);x.closePath();x.fillStyle=hexA(F.c,.07+k*.05);x.fill();x.strokeStyle='rgba(191,244,247,.16)';x.lineWidth=1;x.stroke()}
  }else if(f==='raiz'){
    const gg=x.createRadialGradient(W/2,H,5,W/2,H,H);gg.addColorStop(0,hexA(F.c,.45));gg.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=gg;x.fillRect(0,0,W,H);x.lineCap='round';
    const br=(x0,y0,a,l,d)=>{if(d<=0)return;const x1=x0+Math.cos(a)*l,y1=y0+Math.sin(a)*l;x.strokeStyle=d>3?'rgba(160,122,79,.95)':hexA(F.c,.8);x.lineWidth=d*1.3;x.beginPath();x.moveTo(x0,y0);x.lineTo(x1,y1);x.stroke();
      if(d<=2){x.fillStyle='rgba(217,245,168,.7)';x.beginPath();x.arc(x1,y1,1.6+R()*1.8,0,7);x.fill()}
      br(x1,y1,a-.3-R()*.35,l*(.68+R()*.1),d-1);br(x1,y1,a+.3+R()*.35,l*(.68+R()*.1),d-1)};
    br(W*(.38+R()*.24),H+4,-1.5708+(R()-.5)*.3,34+R()*10,7);
  }else if(f==='umbra'){
    const r=22+R()*16,halo=x.createRadialGradient(cx,cy,r*.8,cx,cy,r*2.8);halo.addColorStop(0,hexA(F.c,.5));halo.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=halo;x.fillRect(0,0,W,H);
    const mc=document.createElement('canvas');mc.width=W;mc.height=H;const m=mc.getContext('2d');m.fillStyle='#efe4ff';m.beginPath();m.arc(cx,cy,r,0,7);m.fill();
    m.globalCompositeOperation='destination-out';m.beginPath();m.arc(cx+r*(.45+R()*.3),cy-r*(.1+R()*.2),r*.95,0,7);m.fill();x.drawImage(mc,0,0);
    for(let k=0;k<3;k++){x.fillStyle=hexA(F.c,.1);x.beginPath();x.ellipse(W*R(),H*(.78+R()*.18),80+R()*60,14+R()*10,0,0,7);x.fill()}
  }else{
    x.fillStyle='rgba(233,223,199,.8)';x.beginPath();x.arc(cx,cy,10+R()*8,0,7);x.fill();
    for(let k=0;k<4;k++){const base=H*(.55+k*.12);x.fillStyle=hexA(k%2?'#8a8070':'#c9bfa8',.12+k*.08);x.beginPath();x.moveTo(0,H);x.lineTo(0,base);let xx=0;while(xx<W){xx+=18+R()*30;x.lineTo(Math.min(xx,W),base-R()*28*(1-k*.2))}x.lineTo(W,H);x.closePath();x.fill()}
  }
  if(kind==='h'){
    x.save();x.translate(W/2,H*.52);x.strokeStyle='rgba(255,255,255,.55)';x.lineWidth=1.2;[30,42].forEach(rr=>{x.beginPath();x.arc(0,0,rr,0,7);x.stroke()});
    const n=5+(R()*4|0);x.beginPath();for(let i=0;i<=n;i++){const a=(i*2%n)/n*6.283-1.5708;const px=Math.cos(a)*30,py=Math.sin(a)*30;i?x.lineTo(px,py):x.moveTo(px,py)}x.strokeStyle=hexA(F.c,.9);x.lineWidth=1.6;x.stroke();
    for(let i=0;i<24;i++){const a=i/24*6.283;x.beginPath();x.moveTo(Math.cos(a)*42,Math.sin(a)*42);x.lineTo(Math.cos(a)*(i%3?45:49),Math.sin(a)*(i%3?45:49));x.stroke()}x.restore();
  }else{
    const n=kind==='hero'?9:5+(R()*4|0),pts=[];for(let i=0;i<n;i++)pts.push([W*(.16+R()*.68),H*(.16+R()*.6)]);pts.sort((a,b)=>a[0]-b[0]);
    x.strokeStyle='rgba(255,255,255,.5)';x.lineWidth=kind==='hero'?1.6:1.1;x.beginPath();pts.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));
    if(kind==='hero'){x.moveTo(pts[1][0],pts[1][1]);x.lineTo(pts[4][0],pts[4][1]);x.lineTo(pts[7][0],pts[7][1])}x.stroke();
    pts.forEach(p=>{const s=1.6+R()*2.2,gl=x.createRadialGradient(p[0],p[1],0,p[0],p[1],s*5);gl.addColorStop(0,hexA(F.c,.95));gl.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=gl;x.fillRect(p[0]-s*5,p[1]-s*5,s*10,s*10);x.fillStyle='#fff';x.beginPath();x.arc(p[0],p[1],s*.75,0,7);x.fill()});
  }
  const v=x.createRadialGradient(W/2,H/2,H*.35,W/2,H/2,H*.95);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.55)');x.fillStyle=v;x.fillRect(0,0,W,H);
  return cv.toDataURL('image/jpeg',.82);
}
