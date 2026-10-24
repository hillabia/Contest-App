"use client";
import {useState} from "react";
import {createClient} from "@supabase/supabase-js";
const url=process.env.NEXT_PUBLIC_SUPABASE_URL??"";
const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY??"";
export default function AdminPage(){
 const [email,setEmail]=useState("");const [password,setPassword]=useState("");const [token,setToken]=useState("");
 const [contestId,setContestId]=useState("");const [title,setTitle]=useState("");const [registrationEndsAt,setRegistrationEndsAt]=useState("");const [votingEndsAt,setVotingEndsAt]=useState("");
 const [roundId,setRoundId]=useState("");const [duration,setDuration]=useState(30);const [entryIds,setEntryIds]=useState("");
 const [result,setResult]=useState("");const [codes,setCodes]=useState<string[]>([]);
 async function login(e:React.FormEvent){e.preventDefault();try{
  if(!url||!key)throw new Error("Configura las variables públicas de Supabase");
  const db=createClient(url,key);
  const {data,error}=await db.auth.signInWithPassword({email,password});
  if(error||!data.session)throw error??new Error("Sesión inválida");
  setToken(data.session.access_token);setPassword("");setResult("Sesión iniciada. Token de sesión solo en memoria.");
 }catch(e){setResult(String(e));}}
 async function action(path:string,body:Record<string,unknown>){
  try{const response=await fetch("/api/admin/"+path,{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify(body)});
  const data=await response.json();setResult(JSON.stringify(data,null,2));
  if(data.roundId)setRoundId(data.roundId);if(data.codes)setCodes(data.codes);
  if(data.id)setContestId(data.id);
  }catch(e){setResult(String(e));}
 }
 return <main style={{maxWidth:800,margin:"3rem auto",padding:20,fontFamily:"sans-serif"}}>
  <h1>Administración del concurso</h1>
  {!token?<form onSubmit={login}><label>Correo del administrador <input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><br/><label>Contraseña <input type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></label><br/><button>Iniciar sesión</button></form>:<>
   <button onClick={()=>{setToken("");setCodes([]);}}>Cerrar sesión local</button>
   <h2>1. Crear concurso</h2>
   <input placeholder="Título" value={title} onChange={e=>setTitle(e.target.value)}/>
   <label>Fin de registro <input type="datetime-local" value={registrationEndsAt} onChange={e=>setRegistrationEndsAt(e.target.value)}/></label>
   <label>Fin de votación <input type="datetime-local" value={votingEndsAt} onChange={e=>setVotingEndsAt(e.target.value)}/></label>
   <button onClick={()=>action("contests",{title,registrationEndsAt:new Date(registrationEndsAt).toISOString(),votingEndsAt:new Date(votingEndsAt).toISOString()})}>Crear</button>
   <h2>2. Concurso</h2><input aria-label="ID del concurso" placeholder="UUID concurso" value={contestId} onChange={e=>setContestId(e.target.value)}/>
   <button onClick={()=>action("guest-codes",{contestId,count:5})}>Generar 5 códigos de invitados</button>
   {codes.length>0&&<div><p>Guarda estos códigos ahora: no se mostrarán otra vez.</p><textarea readOnly value={codes.join("\n")} rows={6}/></div>}
   <button onClick={()=>action("rounds",{contestId})}>Iniciar ronda regular</button>
   <h2>3. Rondas</h2><input aria-label="ID de ronda" placeholder="UUID ronda" value={roundId} onChange={e=>setRoundId(e.target.value)}/>
   <button onClick={()=>action("rounds/close",{roundId})}>Cerrar ronda vencida</button>
   <button onClick={()=>action("rounds/results",{roundId})}>Ver resultados privados</button>
   <button onClick={()=>action("rounds/tiebreak/preview",{roundId})}>Consultar empates</button>
   <label>IDs empatados separados por coma <input value={entryIds} onChange={e=>setEntryIds(e.target.value)}/></label>
   <label>Duración en minutos <input type="number" min={5} max={10080} value={duration} onChange={e=>setDuration(Number(e.target.value))}/></label>
   <button onClick={()=>action("rounds/tiebreak",{contestId,entryIds:entryIds.split(",").map(s=>s.trim()),durationMinutes:duration})}>Iniciar desempate</button>
   <h2>4. Publicación</h2>
   <button onClick={()=>action("rounds/finalize",{contestId})}>Finalizar rondas</button>
   <button onClick={()=>action("reveal",{contestId})}>Revelar ganadores</button>
   <p><a href={"/podio?contestId="+encodeURIComponent(contestId)}>Ver podio público</a></p>
   <pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}} role="status">{result}</pre>
  </>}
 </main>;
}
