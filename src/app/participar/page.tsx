"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
export default function Participate(){
 const [name,setName]=useState("");const [photo,setPhoto]=useState<File|null>(null);const [code,setCode]=useState("");const [error,setError]=useState("");const [busy,setBusy]=useState(false);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setError("");setBusy(true);
  try{
   const contestResponse=await fetch("/api/contest",{cache:"no-store"});
   if(!contestResponse.ok) throw new Error("No se pudo consultar el concurso.");
   const {contest}=await contestResponse.json();
   if(!contest||contest.status!=="registration") throw new Error("No hay inscripciones abiertas.");
   if(!photo) throw new Error("Selecciona una fotografía.");
   const form=new FormData();form.set("contestId",contest.id);form.set("name",name);form.set("photo",photo);
   const response=await fetch("/api/register",{method:"POST",body:form});
   const data=await response.json();
   if(!response.ok) throw new Error(data.error??"No se pudo registrar.");
   setCode(data.code);
  }catch(e){setError(e instanceof Error?e.message:"Error inesperado");}finally{setBusy(false);}
 }
 return <main style={{maxWidth:560,margin:"3rem auto",padding:"1rem",fontFamily:"sans-serif"}}>
  <Link href="/">← Inicio</Link><h1>Participar</h1>
  {code?<section><h2>Registro completado</h2><p>Guarda este código. No volverá a mostrarse.</p><strong style={{overflowWrap:"anywhere"}}>{code}</strong></section>:
  <form onSubmit={submit}><p><label>Nombre<br/><input required minLength={2} maxLength={80} value={name} onChange={e=>setName(e.target.value)}/></label></p>
  <p><label>Fotografía (JPG, PNG o WebP, máximo 5 MB)<br/><input type="file" accept="image/jpeg,image/png,image/webp" required onChange={e=>setPhoto(e.target.files?.[0]??null)}/></label></p>
  <button disabled={busy} type="submit">{busy?"Registrando...":"Registrar fotografía"}</button></form>}
  {error&&<p role="alert">{error}</p>}
 </main>;
}
