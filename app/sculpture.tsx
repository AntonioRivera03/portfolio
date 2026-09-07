'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Info } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import type { StellaratorController, StellaratorMode } from '@/lib/stellarator-scene';

const MODES = {
  form: { label:'Form', index:'01', title:'Engineering the impossible.', description:'50 non-planar coils. 20 planar coils. One extraordinary magnetic cage.', legend:[['#cbd4dc','Non-planar magnets'],['#caa977','Planar magnets']] },
  magnetic: { label:'Magnetic', index:'02', title:'A field with a twist.', description:'Fixed field lines wind around the plasma. The arrows show the field direction.', legend:[['#67e6ff','Magnetic field B'],['#ffd18a','Ion velocity v'],['#ff8392','Force q(v × B)']] },
  particle: { label:'Particle', index:'03', title:'A star, held in place.', description:'Particles stream in both directions and gyrate around the field inside a shaped plasma.', legend:[['#69c9ff','Passing particles'],['#cd74ff','Plasma envelope']] },
};

const FALLBACK_ALT = {
  form: 'Detailed Wendelstein 7-X stellarator model with silver non-planar magnet coils, bronze planar coils, a contoured vacuum vessel and diagnostic ports',
  magnetic: 'Wendelstein 7-X coil outlines surrounding calculated, twisted magnetic field lines',
  particle: 'Wendelstein 7-X plasma envelope with illustrative particles distributed along its twisted magnetic field',
};

export default function Sculpture() {
  const mount=useRef<HTMLDivElement>(null);
  const controller=useRef<StellaratorController|null>(null);
  const [mode,setMode]=useState<StellaratorMode>('particle');
  const [paused,setPaused]=useState(false);
  const [ready,setReady]=useState(false);
  const [unavailable,setUnavailable]=useState(false);
  const [explanation,setExplanation]=useState(false);
  const [retry,setRetry]=useState(0);
  const settings=useRef({mode,paused}); settings.current={mode,paused:paused||explanation};
  const current=MODES[mode];

  useEffect(()=>{
    const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
    setPaused(motion.matches);settings.current.paused=motion.matches;
    const changed=()=>setPaused(motion.matches);motion.addEventListener('change',changed);
    return ()=>motion.removeEventListener('change',changed);
  },[]);

  useEffect(()=>{
    const host=mount.current;if(!host)return;
    const abort=new AbortController();let disposed=false;
    setUnavailable(false);setReady(false);
    import('@/lib/stellarator-scene').then(({createStellaratorScene})=>{
      if(disposed)return;
      return createStellaratorScene(host,{signal:abort.signal,mode:settings.current.mode,paused:settings.current.paused,onContext:available=>{if(!disposed){setReady(available);setUnavailable(!available);}}});
    }).then(scene=>{
      if(!scene)return;if(disposed){scene.dispose();return;}
      controller.current=scene;scene.setMode(settings.current.mode);scene.setPaused(settings.current.paused);
    }).catch(error=>{if(!disposed&&error?.name!=='AbortError'){setUnavailable(true);setReady(false);}});
    return ()=>{disposed=true;abort.abort();controller.current?.dispose();controller.current=null;};
  },[retry]);
  useEffect(()=>{controller.current?.setMode(mode);},[mode]);
  useEffect(()=>{controller.current?.setPaused(paused||explanation);},[paused,explanation]);

  return <>
    <div className="stellarator-heading"><span className="stellarator-mark">✳</span><div><span>WENDELSTEIN 7-X</span><small>A STUDY IN CONFINEMENT</small></div><button className="stellarator-info" onClick={()=>setExplanation(true)} aria-label="Learn about the stellarator model and its physics"><Info size={16}/></button></div>
    <div className={`sculpture-frame stellarator-frame ${ready?'scene-ready':''}`}>
      <img className="sculpture-fallback" src={`/images/stellarator-${mode}.png`} alt={FALLBACK_ALT[mode]} width="1400" height="1400" fetchPriority="high"/>
      <div className="scene-canvas" ref={mount} tabIndex={ready?0:-1} role="group" aria-label={`${current.label} view of Wendelstein 7-X. Drag or use arrow keys to rotate. Press Home to reset.`}/>
    </div>
    <div className="scene-ui stellarator-ui">
      <div className="stellarator-caption" aria-live="polite"><span className="stellarator-view-index">{current.index} /</span><p>{current.title}</p></div>
      <div className="scene-controls">
        <Tabs value={mode} onValueChange={value=>setMode(value as StellaratorMode)} className="material-tabs"><TabsList aria-label="Stellarator view"><TabsTrigger value="form">Form</TabsTrigger><TabsTrigger value="magnetic">Magnetic</TabsTrigger><TabsTrigger value="particle">Particle</TabsTrigger></TabsList></Tabs>
      </div>
      <div className="stellarator-legend">{(!ready&&mode==='magnetic'?current.legend.slice(0,1):current.legend).map(([color,label])=><span key={label}><i style={{background:color}}/>{label}</span>)}</div>
      <p className="stellarator-note">{unavailable?'Still-image mode · Interactive 3D unavailable':ready?'Drag to explore · Educational visualization':'Preparing the magnetic geometry…'}{unavailable&&<button onClick={()=>setRetry(n=>n+1)}>Retry 3D</button>}</p>
    </div>
    <Dialog open={explanation} onOpenChange={setExplanation}><DialogContent className="project-dialog stellarator-dialog">
      <span className="eyebrow">WENDELSTEIN 7-X / BEHIND THE GEOMETRY</span>
      <DialogTitle className="dialog-title">Holding a star.</DialogTitle>
      <DialogDescription className="dialog-summary">A stellarator uses external magnetic coils to confine hot plasma in a twisted ring. This interactive study is based on published W7-X geometry.</DialogDescription>
      <div className="stellarator-explanation-grid">
        <div><span>01 / FORM</span><h3>The machine.</h3><p>W7-X has 50 non-planar and 20 planar superconducting coils in five repeating modules. Here the outer cryostat is omitted to reveal the internal structure. Coil centerlines and the plasma boundary come from scientific data; casings, supports, ports, and materials are simplified reconstructions.</p></div>
        <div><span>02 / MAGNETIC</span><h3>The invisible cage.</h3><p>The non-planar coils produce a three-dimensional field with rotational transform: field lines wind both around the ring and around its cross-section. The displayed paths are numerical vacuum-field traces, not decorative helices. In this standard configuration, the planar coils carry zero current.</p></div>
        <div><span>03 / PARTICLE</span><h3>The plasma.</h3><p>Charged particles travel along the field and gyrate around it. Both directions of parallel motion are shown inside the published plasma boundary. The glowing envelope stays shaped while its visual texture evolves; the plasma does not rotate as a rigid object.</p></div>
      </div>
      <div className="lorentz-explainer"><span>THE MAGNETIC FORCE</span><strong>F = q(v × B)</strong><p>The force is perpendicular to both velocity and magnetic field. In Magnetic view, the amber marker is a positive ion: blue shows B, amber shows v, and coral shows the bending force. Its orbit and arrows are enlarged to make the relationship visible.</p></div>
      <p className="project-note">An educational visualization, not a reactor digital twin or a plasma simulation. Field traces use a thin-filament Biot–Savart model with fixed coil currents. Particle motion, colors, brightness, and time scales are illustrative; collisions, drifts, trapped-particle motion, heating, and plasma feedback are not simulated. W7-X is a fusion research device, not an electricity-generating power plant.</p>
      <div className="stellarator-sources"><span className="eyebrow">EXPLORE THE SCIENCE</span><a href="https://www.ipp.mpg.de/2815279/technologie" target="_blank" rel="noreferrer">Max Planck IPP · The W7-X machine <ArrowUpRight size={14}/></a><a href="https://suli.pppl.gov/2022/course/2022-06-14_SULI_course_hammond.pdf" target="_blank" rel="noreferrer">Princeton Plasma Physics Laboratory · Stellarators <ArrowUpRight size={14}/></a><a href="https://github.com/hiddenSymmetries/simsopt/blob/c648630cfc5625863b291709c17015bcdcba13af/src/simsopt/configs/W7-X.dat" target="_blank" rel="noreferrer">Simsopt · Published coil geometry <ArrowUpRight size={14}/></a><a href="/data/stellarator-LICENSE.txt" target="_blank" rel="noreferrer">Geometry data license <ArrowUpRight size={14}/></a></div>
    </DialogContent></Dialog>
  </>;
}
