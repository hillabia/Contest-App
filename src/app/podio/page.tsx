"use client";
import {useEffect,useState} from "react";
type Winner={id:string;name:string;url:string};
export default function PodiumPage(){
 const [contestId,setContestId]=useState("");const [title,setTitle]=useState("");const [winners,setWinners]=useState<Winner[]>([]);
 const [revealed,setRevealed]=useState<string[]>([]);const [message,setMessage]=useState("Cargando podio...");
 useEffect(()=>{let cancelled=false;const requested=new URLSearchParams(window.location.search).get("contestId");
  if(requested){setContestId(requested);return;}
  fetch("/api/contest",{cache:"no-store"}).then(async r=>{const data=await r.json();if(!r.ok)throw new Error(data.error??"No se pudo encontrar el concurso");
   if(!cancelled){if(data.contest?.id)setContestId(data.contest.id);else setMessage("No hay concurso disponible todavía.");}
  }).catch(e=>{if(!cancelled)setMessage(e instanceof Error?e.message:"No se pudo consultar el concurso");});
  return()=>{cancelled=true};
 },[]);
 useEffect(()=>{if(!contestId)return;fetch("/api/podium?contestId="+encodeURIComponent(contestId),{cache:"no-store"}).then(async r=>{const data=await r.json();if(!r.ok)throw new Error(data.error);setTitle(data.title);setWinners(data.winners);setMessage(data.winners.length?"":"No hay ganadores disponibles todavía.");}).catch(e=>setMessage(e.message));},[contestId]);
 return <main style={{maxWidth:950,margin:"3rem auto",padding:20,fontFamily:"sans-serif"}}>
  <h1>Podio del concurso</h1><h2>{title}</h2>
  {message&&<p role="status">{message}</p>}
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:20}}>
   {winners.map((w,i)=><article key={w.id} style={{padding:16,border:"1px solid #ddd",borderRadius:12,textAlign:"center"}}>
    <h3>{["🥇 Primer lugar","🥈 Segundo lugar","🥉 Tercer lugar"][i]}</h3>
    <img src={w.url} alt={"Fotografía ganadora del lugar "+(i+1)} style={{width:"100%",aspectRatio:"1",objectFit:"cover",borderRadius:8}}/>
    <button type="button" aria-expanded={revealed.includes(w.id)} onClick={()=>setRevealed(s=>s.includes(w.id)?s.filter(id=>id!==w.id):[...s,w.id])} style={{marginTop:16,padding:12,width:"100%",cursor:"pointer"}}>
     {revealed.includes(w.id)?w.name:"Girar tarjeta y revelar nombre"}
    </button>
   </article>)}
  </div>
 </main>;
}
