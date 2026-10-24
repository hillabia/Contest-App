import { randomBytes, createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/infrastructure/auth/admin-session";
import { serverDatabase } from "@/infrastructure/supabase/server";
const schema=z.object({contestId:z.string().uuid(),count:z.number().int().min(1).max(25)});
export async function POST(request:Request){
 if(!await requireAdmin(request)) return NextResponse.json({error:"No autorizado"},{status:401});
 let parsed;
 try{parsed=schema.safeParse(await request.json());}catch{return NextResponse.json({error:"JSON inválido"},{status:400});}
 if(!parsed.success)return NextResponse.json({error:"Solicitud inválida"},{status:400});
 const {contestId,count}=parsed.data;
 const db=serverDatabase();
 const {data:contest,error:contestError}=await db.from("contests").select("status").eq("id",contestId).maybeSingle();
 if(contestError)return NextResponse.json({error:"Error al verificar concurso"},{status:503});
 if(!contest||!["registration","voting","tiebreak"].includes(contest.status))
  return NextResponse.json({error:"Concurso no disponible"},{status:409});
 const codes=Array.from({length:count},()=>randomBytes(24).toString("base64url"));
 const rows=codes.map(code=>({contest_id:contestId,entry_id:null,role:"guest",code_hash:createHash("sha256").update(code).digest("hex")}));
 const {error}=await db.from("access_codes").insert(rows);
 if(error)return NextResponse.json({error:"No se pudieron generar los códigos"},{status:503});
 return NextResponse.json({codes,message:"Guarda los códigos: no podrán recuperarse después."},{status:201,headers:{"Cache-Control":"no-store, no-cache, must-revalidate","Pragma":"no-cache"}});
}
