import {NextResponse} from "next/server";
import {z} from "zod";
import {requireAdmin} from "@/infrastructure/auth/admin-session";
import {serverDatabase} from "@/infrastructure/supabase/server";
const schema=z.object({contestId:z.string().uuid(),registrationEndsAt:z.iso.datetime({offset:true}),votingEndsAt:z.iso.datetime({offset:true})});
export async function PATCH(request:Request){
 if(!await requireAdmin(request))return NextResponse.json({error:"No autorizado"},{status:401});
 let body:unknown;try{body=await request.json();}catch{return NextResponse.json({error:"JSON inválido"},{status:400});}
 const parsed=schema.safeParse(body);if(!parsed.success)return NextResponse.json({error:"Datos inválidos"},{status:400});
 const {contestId,registrationEndsAt,votingEndsAt}=parsed.data;
 const registration=Date.parse(registrationEndsAt),voting=Date.parse(votingEndsAt);
 if(!Number.isFinite(registration)||!Number.isFinite(voting)||registration<=Date.now()||voting<=registration)
  return NextResponse.json({error:"El cierre de registro debe ser futuro y el cierre de votación debe ser posterior."},{status:400});
 const db=serverDatabase();
 const {data:contest,error:readError}=await db.from("contests").select("id,status").eq("id",contestId).maybeSingle();
 if(readError)return NextResponse.json({error:"No se pudo consultar el concurso"},{status:503});
 if(!contest)return NextResponse.json({error:"Concurso no encontrado"},{status:404});
 if(contest.status!=="registration")return NextResponse.json({error:"Solo se pueden modificar fechas durante la fase de registro."},{status:409});
 const {count,error:roundError}=await db.from("voting_rounds").select("id",{count:"exact",head:true}).eq("contest_id",contestId);
 if(roundError)return NextResponse.json({error:"No se pudieron validar las rondas"},{status:503});
 if((count??0)>0)return NextResponse.json({error:"No se pueden cambiar las fechas después de crear rondas."},{status:409});
 const {data,error}=await db.from("contests").update({registration_ends_at:registrationEndsAt,voting_ends_at:votingEndsAt}).eq("id",contestId).eq("status","registration").select("id,registration_ends_at,voting_ends_at,status").maybeSingle();
 if(error)return NextResponse.json({error:"No se pudieron actualizar las fechas"},{status:503});
 if(!data)return NextResponse.json({error:"El concurso cambió de estado. Actualiza la página."},{status:409});
 return NextResponse.json({contest:data},{headers:{"Cache-Control":"no-store"}});
}
