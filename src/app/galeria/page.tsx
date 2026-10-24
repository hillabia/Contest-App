"use client";
import {useEffect,useState} from "react";
type Photo={id:string;url:string};
export default function Gallery(){
 const [photos,setPhotos]=useState<Photo[]>([]);const [message,setMessage]=useState("Cargando galería...");
 useEffect(()=>{let cancelled=false;(async()=>{
  try{
   const c=await fetch("/api/contest",{cache:"no-store"}).then(r=>r.json());
   if(!c.contest){setMessage("No hay concurso activo.");return;}
   const response=await fetch("/api/gallery?contestId="+encodeURIComponent(c.contest.id),{cache:"no-store"});
   if(!response.ok) throw new Error();
   const data=await response.json();
   if(!cancelled){setPhotos(data.photos);setMessage(data.photos.length?"":"Aún no hay fotografías.");}
  }catch{if(!cancelled)setMessage("No se pudo cargar la galería.");}
 })();return()=>{cancelled=true};},[]);
 return <main style={{maxWidth:900,margin:"3rem auto",padding:"1rem",fontFamily:"sans-serif"}}><a href="/">← Inicio</a><h1>Galería anónima</h1>
 {photos.length?<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:16}}>{photos.map(p=><img key={p.id} src={p.url} alt="Diseño participante" style={{width:"100%",aspectRatio:"1",objectFit:"cover",borderRadius:12}}/>)}</div>:<p>{message}</p>}</main>;
}
