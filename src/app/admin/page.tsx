"use client";
import {useState} from "react";
type Entry={id:string;name:string;status:string;created_at:string};
type Round={id:string;round_number:number;kind:string;status:string;starts_at:string;ends_at:string};
import {createClient} from "@supabase/supabase-js";
const url=process.env.NEXT_PUBLIC_SUPABASE_URL??"";
const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY??"";
function localDate(value:string){const d=new Date(value);if(Number.isNaN(d.getTime()))return "";const pad=(x:number)=>String(x).padStart(2,"0");return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;}
export default function AdminPage(){
 const [email,setEmail]=useState("");const [password,setPassword]=useState("");const [token,setToken]=useState("");
 const [contestId,setContestId]=useState("");const [title,setTitle]=useState("");const [registrationEndsAt,setRegistrationEndsAt]=useState("");const [votingEndsAt,setVotingEndsAt]=useState("");
 const [roundId,setRoundId]=useState("");const [duration,setDuration]=useState(30);const [entryIds,setEntryIds]=useState("");
 const [result,setResult]=useState("");const [codes,setCodes]=useState<string[]>([]);
 const [entries,setEntries]=useState<Entry[]>([]);const [rounds,setRounds]=useState<Round[]>([]);const [contestStatus,setContestStatus]=useState("");
 async function refreshCurrent(accessToken:string){
  const response=await fetch("/api/admin/current",{headers:{Authorization:"Bearer "+accessToken},cache:"no-store"});
  const data=await response.json();
  if(!response.ok)throw new Error(data.error??"No se pudo recuperar el concurso");
  setEntries(data.entries??[]);setRounds(data.rounds??[]);
  if(data.contest){setContestId(data.contest.id);setTitle(data.contest.title);setContestStatus(data.contest.status);
   setRegistrationEndsAt(localDate(data.contest.registration_ends_at));setVotingEndsAt(localDate(data.contest.voting_ends_at));
   const active=(data.rounds??[])[0];setRoundId(active?.id??"");
  }else{setContestId("");setContestStatus("");setRoundId("");}
 }
 async function login(e:React.FormEvent){e.preventDefault();try{
  if(!url||!key)throw new Error("Configura las variables públicas de Supabase");
  const db=createClient(url,key);
  const {data,error}=await db.auth.signInWithPassword({email,password});
  if(error||!data.session)throw error??new Error("Sesión inválida");
  setToken(data.session.access_token);setPassword("");setResult("Sesión iniciada.");
  try{await refreshCurrent(data.session.access_token);}catch(error){setResult(error instanceof Error?error.message:"No se pudo recuperar el concurso");}
 }catch(e){setResult(String(e));}}
 async function saveDates(){try{
  if(!registrationEndsAt||!votingEndsAt)throw new Error("Selecciona ambas fechas");
  const response=await fetch("/api/admin/contests/dates",{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify({contestId,registrationEndsAt:new Date(registrationEndsAt).toISOString(),votingEndsAt:new Date(votingEndsAt).toISOString()})});
  const data=await response.json();if(!response.ok)throw new Error(data.error??"No se guardaron las fechas");
  await refreshCurrent(token);setResult("Fechas del concurso actualizadas correctamente.");
 }catch(e){setResult(e instanceof Error?e.message:String(e));}}
 async function action(path:string,body:Record<string,unknown>){
  try{const response=await fetch("/api/admin/"+path,{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify(body)});
  const data=await response.json();setResult(JSON.stringify(data,null,2));
  if(data.roundId)setRoundId(data.roundId);if(data.codes)setCodes(data.codes);
  if(data.id)setContestId(data.id);
  if(response.ok)await refreshCurrent(token);
  }catch(e){setResult(String(e));}
 }
 return <main style={{maxWidth:800,margin:"3rem auto",padding:20,fontFamily:"sans-serif"}}>
  <h1>Administración del concurso</h1>
  {!token?<form onSubmit={login}><label>Correo del administrador <input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><br/><label>Contraseña <input type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></label><br/><button>Iniciar sesión</button></form>:<>
   <button onClick={()=>{setToken("");setCodes([]);setEntries([]);setRounds([]);setContestId("");setContestStatus("");}}>Cerrar sesión local</button>
   <h2>Concurso actual</h2>
   <button type="button" onClick={()=>refreshCurrent(token).catch(e=>setResult(String(e)))}>Actualizar concurso</button>
   {contestId?<section><h3>{title}</h3><p>Estado: <strong>{contestStatus}</strong></p><p>Participantes registrados: {entries.length} · Rondas: {rounds.length}</p>
   <h3>Editar fechas del concurso</h3><p>Solo antes de iniciar la votación y mientras el concurso esté en registro.</p>
   <label>Cierre de inscripciones <input type="datetime-local" value={registrationEndsAt} onChange={e=>setRegistrationEndsAt(e.target.value)} disabled={contestStatus!=="registration"||rounds.length>0}/></label>
   <label>Fin de votación <input type="datetime-local" value={votingEndsAt} onChange={e=>setVotingEndsAt(e.target.value)} disabled={contestStatus!=="registration"||rounds.length>0}/></label>
   <button type="button" onClick={saveDates} disabled={contestStatus!=="registration"||rounds.length>0}>Guardar cambios de fechas</button>
   <h3>Competidores</h3>{entries.length?<ul>{entries.map(e=><li key={e.id}>{e.name} — {e.status}</li>)}</ul>:<p>Aún no hay participantes.</p>}
   <h3>Rondas registradas</h3>{rounds.map(r=><p key={r.id}>Ronda {r.round_number} ({r.kind}) — {r.status} <button type="button" onClick={()=>setRoundId(r.id)}>Seleccionar</button></p>)}
   <p>Modificar participantes todavía requiere funciones administrativas con validaciones.</p></section>:<p>No hay ningún concurso activo.</p>}
   {!contestId&&<><h2>1. Crear concurso</h2>
   <input placeholder="Título" value={title} onChange={e=>setTitle(e.target.value)}/>
   <label>Fin de registro <input type="datetime-local" value={registrationEndsAt} onChange={e=>setRegistrationEndsAt(e.target.value)}/></label>
   <label>Fin de votación <input type="datetime-local" value={votingEndsAt} onChange={e=>setVotingEndsAt(e.target.value)}/></label>
   <button onClick={()=>action("contests",{title,registrationEndsAt:new Date(registrationEndsAt).toISOString(),votingEndsAt:new Date(votingEndsAt).toISOString()})}>Crear</button>
   </>}
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
   <h2>5. Eliminar concurso</h2><p>La eliminación definitiva requiere confirmar la identidad, borrar las fotografías y comprobar la limpieza de la base de datos. Esta función permanece deshabilitada hasta que el procedimiento seguro esté implementado y validado.</p><button disabled title="Pendiente de procedimiento de eliminación verificable">Eliminar concurso</button>
   <pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}} role="status">{result}</pre>
  </>}
 </main>;
}
