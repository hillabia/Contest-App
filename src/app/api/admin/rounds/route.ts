import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthorized } from "@/infrastructure/auth/admin";
import { serverDatabase } from "@/infrastructure/supabase/server";
const schema=z.object({contestId:z.string().uuid()});
export async function POST(request:Request){
 if(!isAdminAuthorized(request))return NextResponse.json({error:"No autorizado"},{status:401});
 let parsed;
 try{parsed=schema.safeParse(await request.json());}catch{return NextResponse.json({error:"JSON inválido"},{status:400});}
 if(!parsed.success)return NextResponse.json({error:"Concurso inválido"},{status:400});
 const db=serverDatabase();
 const {data:contest,error:contestError}=await db.from("contests").select("id,status,registration_ends_at,voting_ends_at").eq("id",parsed.data.contestId).single();
 if(contestError||!contest)return NextResponse.json({error:"Concurso no encontrado"},{status:404});
 if(contest.status!=="registration" || Date.now()<Date.parse(contest.registration_ends_at) || Date.now()>=Date.parse(contest.voting_ends_at))
  return NextResponse.json({error:"La ventana de votación no está disponible"},{status:409});
 const {data:entries,error:entriesError}=await db.from("entries").select("id").eq("contest_id",contest.id).eq("status","approved");
 if(entriesError)return NextResponse.json({error:"No se pudieron consultar las fotografías"},{status:503});
 if((entries?.length??0)<3)return NextResponse.json({error:"Se requieren al menos tres fotografías aprobadas."},{status:409});
 // An atomic database transition is required; do not attempt separate writes here.
 const {data,error}=await db.rpc("start_regular_round",{p_contest_id:contest.id});
 if(error)return NextResponse.json({error:"No se pudo iniciar la ronda."},{status:409});
 return NextResponse.json({roundId:data},{status:201});
}
