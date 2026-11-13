/* One reversible, scroll-controlled timeline. No autoplay, timer, progress bar or wheel interception. */
(()=>{
  'use strict';
  const journey=document.querySelector('.journey');
  const sceneNodes=[...document.querySelectorAll('.scene')];
  const canvas=document.querySelector('.water-canvas');
  if(!journey||!sceneNodes.length||!canvas)return;
  const ctx=canvas.getContext('2d',{alpha:true});
  const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
  const ease=x=>{x=clamp(x);return x*x*(3-2*x)};
  const stage=(p,a,b)=>ease((p-a)/(b-a));
  const pulse=(p,a,b,c,d)=>stage(p,a,b)*(1-stage(p,c,d));
  const set=(e,k,v)=>e.style.setProperty(k,String(Math.round(v*10000)/10000));
  const frac=x=>x-Math.floor(x);
  const hash=x=>frac(Math.sin(x*127.1+34.8)*43758.5453123);
  let W=0,H=0,DPR=1,scheduled=false,lastWash=-1;
  function resizeCanvas(){
    let w=canvas.clientWidth,h=canvas.clientHeight,d=Math.min(devicePixelRatio||1,1.5);
    if(w!==W||h!==H||d!==DPR){W=w;H=h;DPR=d;canvas.width=Math.max(1,Math.floor(w*d));canvas.height=Math.max(1,Math.floor(h*d));ctx.setTransform(d,0,0,d,0,0)}
  }
  function drawSpray(p,intensity){
    resizeCanvas();
    if(!ctx)return;
    ctx.clearRect(0,0,W,H);
    if(intensity<.01)return;
    const mobile=W<751;
    const ox=W*(mobile?.04:.24),oy=H*(mobile?.39:.25);
    const tx=W*(mobile?.58:.66),ty=H*(mobile?.56:.52);
    const dx=tx-ox,dy=ty-oy;
    const sweep=(.55+.45*Math.sin(p*15));
    ctx.save();ctx.globalCompositeOperation='screen';
    // Fine, semi-transparent water filaments. Their trajectories are deterministic for reverse scrolling.
    const g=ctx.createLinearGradient(ox,oy,tx,ty);
    g.addColorStop(0,'rgba(178,220,245,.04)');g.addColorStop(.48,'rgba(230,247,255,.13)');g.addColorStop(1,'rgba(184,227,255,.015)');
    ctx.lineWidth=mobile?14:22;ctx.strokeStyle=g;ctx.globalAlpha=intensity*.55;
    ctx.beginPath();ctx.moveTo(ox,oy);ctx.quadraticCurveTo(ox+dx*.44,oy+dy*.08,tx,ty);ctx.stroke();
    const count=mobile?220:380;
    for(let i=0;i<count;i++){
      const a=hash(i*1.33+9),b=hash(i*1.91+2),c=hash(i*2.17+8);
      const travel=frac(a+p*1.7*(.4+b));
      const dispersion=(travel*travel)*(.16+.25*hash(i*3.17));
      const px=ox+dx*travel+((b-.5)*dispersion*W*.3);
      const py=oy+dy*travel+((c-.5)*dispersion*H*.3)+Math.sin(travel*3.5)*H*.018;
      const sz=(1+hash(i*1.13)*5)*(mobile?.75:1.2);
      ctx.globalAlpha=intensity*(.08+hash(i*7.1)*.44);
      ctx.strokeStyle=i%5===0?'#f1fcff':'#8cc9ef';
      ctx.lineWidth=.3+hash(i*2.2)*1.2;
      ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+dx/W*sz*3,py+dy/H*sz*3);ctx.stroke();
    }
    // Radial splash once the jet meets the bonnet.
    const prog=stage(p,.27,.51);
    for(let i=0;i<170;i++){
      const angle=hash(i*1.9)*Math.PI*2;
      const speed=(.04+hash(i*7.5)*.24)*Math.min(W,H)*(frac(p*3+hash(i*3.7))*.95);
      const xx=tx+Math.cos(angle)*speed*(mobile?.7:1.2);
      const yy=ty+Math.sin(angle)*speed*.53;
      ctx.globalAlpha=intensity*.44*(1-frac(p*3+hash(i*3.7)));
      ctx.fillStyle=i%4?'#b8dbf0':'#ffffff';
      ctx.beginPath();ctx.ellipse(xx,yy,Math.max(.5,hash(i*5.2)*1.4),Math.max(.7,hash(i*4.7)*2.3),0,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }
  function render(){
    scheduled=false;
    const rect=journey.getBoundingClientRect();
    const travel=Math.max(1,rect.height-innerHeight);
    const P=clamp(-rect.top/travel);
    const t=P*4;
    for(let i=0;i<4;i++){
      const local=clamp(t-i);
      const alpha=(i===0?1:stage(t,i-.12,i+.13))*(i===3?1:1-stage(t,i+.88,i+1.13));
      const node=sceneNodes[i];
      set(node,'--a',alpha);
      set(node,'--story-show',alpha*(1-stage(local,.18,.52)));
      set(node,'--story-rise',local);
      set(node,'--service-show',alpha*stage(local,.50,.76));
      set(node,'--cam',local);
    }
    const wash=sceneNodes[0],w=clamp(t),foam=stage(w,.17,.31)*(1-stage(w,.43,.57)),rinse=stage(w,.43,.57)*(1-stage(w,.66,.79));
    set(wash,'--dirty',1-stage(w,.16,.31));
    set(wash,'--foam',foam);
    set(wash,'--rinse',rinse);
    set(wash,'--clean',stage(w,.67,.83));
    const spray=pulse(w,.39,.49,.68,.81);
    set(wash,'--spray',spray);
    set(wash,'--wash-zoom',stage(w,.83,1));
    set(wash,'--wash-shift',stage(w,.79,1));
    set(wash,'--hint',1-stage(w,.01,.11));
    if(spray>.001&&P<.25)drawSpray(w,spray);
    else if(lastWash>.001){resizeCanvas();ctx.clearRect(0,0,W,H)}
    lastWash=spray;
    const polish=sceneNodes[1],q=clamp(t-1);
    set(polish,'--polish-enter',stage(q,.08,.40));
    set(polish,'--polish-car',1-stage(q,.17,.40));
    set(polish,'--paint-scratch',1-stage(q,.67,.88));
    set(polish,'--paint-buff',0); // the buffer moves independently; avoid a double-tool photograph
    set(polish,'--paint-finish',stage(q,.71,.89));
    set(polish,'--polish-tool-show',pulse(q,.4,.5,.70,.83));
    set(polish,'--tool-x',.45+.5*Math.sin(q*19));
    set(polish,'--tool-y',.45+.38*Math.cos(q*25));
    set(polish,'--tool-rot',.5+.5*Math.sin(q*29));
    set(polish,'--polish-complete',stage(q,.73,.97));
    set(polish,'--polish-scene-zoom',stage(q,.10,.43));
    const interior=sceneNodes[2],r=clamp(t-2);
    set(interior,'--interior-entry',stage(r,.01,.29));
    set(interior,'--interior-car-alpha',1-stage(r,.28,.46));
    set(interior,'--inside-show',stage(r,.27,.48));
    set(interior,'--inside-zoom',stage(r,.23,.53));
    set(interior,'--vac-tool-alpha',pulse(r,.43,.52,.77,.90));
    set(interior,'--vac-x',1-stage(r,.42,.83)+Math.sin(r*23)*.15);
    set(interior,'--vac-y',.54+.4*Math.sin(r*19));
    set(interior,'--vac-rot',.5+.5*Math.sin(r*18));
    set(interior,'--vac-reveal',stage(r,.60,.88));
    set(interior,'--interior-exit',stage(t,2.88,3.1));
    const tail=sceneNodes[3],s=clamp(t-3);
    set(tail,'--rear-zoom',stage(s,.03,.45));
    set(tail,'--tail-pan',stage(s,.20,.75));
    set(tail,'--tail-finish',stage(s,.59,.88));
    set(tail,'--tail-glint',stage(s,.64,.95));
  }
  function request(){if(!scheduled){scheduled=true;requestAnimationFrame(render)}}
  window.addEventListener('scroll',request,{passive:true});
  window.addEventListener('resize',()=>{resizeCanvas();request()},{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)request()});
  window.addEventListener('pageshow',request);
  request();
})();
