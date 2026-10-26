"use client";
import Link from "next/link";
import { useState } from "react";
type Photo={id:string;url:string};
export default function Vote(){
 const [code,setCode]=useState("");const [roundId,setRoundId]=useState("");
 const [photos,setPhotos]=useState<Photo[]>([]);const [error,setError]=useState("");
 const [done,setDone]=useState(false);const [busy,setBusy]=useState(false);
 async function load(){
  setBusy(true);setError("");
  try{
   const r=await fetch("/api/voting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code})});
   const data=await r.json();if(!r.ok)throw new Error(data.error);
   setPhotos(data.photos);setRoundId(data.roundId);
  }catch(e){setError(e instanceof Error?e.message:"Error");}finally{setBusy(false);}
 }
 function move(index:number,offset:number){
  const next=[...photos];const target=index+offset;
  if(target<0||target>=next.length)return;
  [next[index],next[target]]=[next[target],next[index]];setPhotos(next);
 }
 async function submit(){
  setBusy(true);setError("");
  try{
   const r=await fetch("/api/voting/submit",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code,roundId,rankedIds:photos.map(p=>p.id)})});
   const data=await r.json();if(!r.ok)throw new Error(data.error);
   setDone(true);setPhotos([]);setCode("");
  }catch(e){setError(e instanceof Error?e.message:"Error");}finally{setBusy(false);}
 }
 return <main style={{maxWidth:760,margin:"3rem auto",padding:"1rem",fontFamily:"sans-serif"}}>
 <Link href="/">← Inicio</Link><h1>Votar</h1>
 {done?<p>¡Voto registrado! No se puede modificar.</p>:<>
 {!roundId?<section><p>Introduce tu código individual para ver las fotografías que puedes calificar.</p>
 <label>Código de acceso <input type="password" autoComplete="off" value={code} onChange={e=>setCode(e.target.value)}/></label>
 <button onClick={load} disabled={busy||code.length<12}>Entrar a votar</button></section>:
 <section><p>Ordena <strong>todas</strong> las fotografías: la primera recibe más puntos. Usa los botones para cambiar posiciones.</p>
 {photos.map((photo,i)=><article key={photo.id} style={{display:"flex",alignItems:"center",gap:16,padding:12,borderBottom:"1px solid #ccc"}}>
 <strong>{i+1}.</strong><img src={photo.url} alt={`Fotografía en posición ${i+1}`} style={{width:130,height:130,objectFit:"cover"}}/>
 <div><button aria-label={`Subir fotografía ${i+1}`} onClick={()=>move(i,-1)} disabled={i===0}>↑</button>
 <button aria-label={`Bajar fotografía ${i+1}`} onClick={()=>move(i,1)} disabled={i===photos.length-1}>↓</button></div></article>)}
 <button onClick={submit} disabled={busy||photos.length<2}>Confirmar voto definitivo</button>
 </section>}</>}
 {error&&<p role="alert">{error}</p>}
 </main>;
}
