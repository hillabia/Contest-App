import {NextResponse} from "next/server";
import {z} from "zod";
import {requireAdmin} from "@/infrastructure/auth/admin-session";
import {serverDatabase} from "@/infrastructure/supabase/server";
import {readPodium} from "@/infrastructure/supabase/podium-reader";
const schema=z.object({contestId:z.string().uuid(),entryIds:z.array(z.string().uuid()).min(2).max(100),durationMinutes:z.number().int().min(5).max(10080)});
export async function POST(request:Request){
 if(!await requireAdmin(request))return NextResponse.json({error:"No autorizado"},{status:401});
 let parsed;try{parsed=schema.safeParse(await request.json());}catch{return NextResponse.json({error:"JSON inválido"},{status:400});}
 if(!parsed.success)return NextResponse.json({error:"Datos inválidos"},{status:400});
 const {contestId,entryIds,durationMinutes}=parsed.data;
 if(new Set(entryIds).size!==entryIds.length)return NextResponse.json({error:"Fotografías repetidas"},{status:400});
 try{
  const result=await readPodium(contestId);
  if(!result.unresolved.some(group=>group.length===entryIds.length&&group.every(id=>entryIds.includes(id))))
   return NextResponse.json({error:"Las fotografías no corresponden a un empate pendiente del podio."},{status:409});
  const {data,error}=await serverDatabase().rpc("start_tiebreak_round",{p_contest_id:contestId,p_entry_ids:entryIds,p_duration_minutes:durationMinutes});
  if(error)throw error;
  return NextResponse.json({roundId:data},{status:201,headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"No fue posible iniciar el desempate."},{status:409});}
}
