import {NextResponse} from "next/server";
import {serverDatabase} from "@/infrastructure/supabase/server";
import {readPodium} from "@/infrastructure/supabase/podium-reader";
export const dynamic="force-dynamic";
export async function GET(request:Request){
 const id=new URL(request.url).searchParams.get("contestId")??"";
 if(!/^[0-9a-f-]{36}$/i.test(id))return NextResponse.json({error:"Concurso inválido"},{status:400});
 const db=serverDatabase();
 const {data:contest,error}=await db.from("contests").select("status,title").eq("id",id).maybeSingle();
 if(error||!contest)return NextResponse.json({error:"Concurso no encontrado"},{status:404});
 if(contest.status!=="revealed")return NextResponse.json({error:"Resultados aún no publicados"},{status:403});
 try{
  const {podium,unresolved}=await readPodium(id);
  if(unresolved.length)return NextResponse.json({error:"Resultados pendientes"},{status:409});
  const winners=[];
  for(const entryId of podium){
   const {data:entry,error:entryError}=await db.from("entries").select("name,image_path").eq("contest_id",id).eq("id",entryId).single();
   if(entryError||!entry)throw new Error("Missing winner");
   const {data:signed,error:storageError}=await db.storage.from("contest-photos").createSignedUrl(entry.image_path,120);
   if(storageError)throw storageError;
   winners.push({id:entryId,name:entry.name,url:signed.signedUrl});
  }
  return NextResponse.json({title:contest.title,winners},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"No fue posible consultar el podio"},{status:503});}
}
