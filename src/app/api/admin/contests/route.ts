import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/infrastructure/auth/admin-session";
import { serverDatabase } from "@/infrastructure/supabase/server";
const schema=z.object({title:z.string().trim().min(2).max(120),registrationEndsAt:z.iso.datetime({offset:true}),votingEndsAt:z.iso.datetime({offset:true})});
export async function POST(request:Request){
 if(!await requireAdmin(request))return NextResponse.json({error:"No autorizado"},{status:401});
 let parsed;
 try{parsed=schema.safeParse(await request.json());}catch{return NextResponse.json({error:"JSON inválido"},{status:400});}
 if(!parsed.success)return NextResponse.json({error:"Datos inválidos"},{status:400});
 const {title,registrationEndsAt,votingEndsAt}=parsed.data;
 if(Date.parse(registrationEndsAt)<=Date.now() || Date.parse(votingEndsAt)<=Date.parse(registrationEndsAt))
  return NextResponse.json({error:"Fechas inválidas"},{status:400});
 const db=serverDatabase();
 const {data:active,error:activeError}=await db.from("contests").select("id").neq("status","purged").limit(1);
 if(activeError)return NextResponse.json({error:"No se pudo comprobar el concurso activo"},{status:503});
 if(active?.length)return NextResponse.json({error:"Finaliza y elimina el concurso anterior antes de crear otro."},{status:409});
 const {data,error}=await db.from("contests").insert({title,registration_ends_at:registrationEndsAt,voting_ends_at:votingEndsAt,status:"registration"}).select("id,title,status").single();
 if(error)return NextResponse.json({error:"No se pudo crear el concurso"},{status:503});
 return NextResponse.json(data,{status:201,headers:{"Cache-Control":"no-store"}});
}
