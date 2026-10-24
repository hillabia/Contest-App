import {NextResponse} from "next/server";
import {z} from "zod";
import {requireAdmin} from "@/infrastructure/auth/admin-session";
import {serverDatabase} from "@/infrastructure/supabase/server";
import {readPodium} from "@/infrastructure/supabase/podium-reader";
const schema=z.object({contestId:z.string().uuid()});
export async function POST(request:Request){
 if(!await requireAdmin(request))return NextResponse.json({error:"No autorizado"},{status:401});
 let parsed;try{parsed=schema.safeParse(await request.json());}catch{return NextResponse.json({error:"JSON inválido"},{status:400});}
 if(!parsed.success)return NextResponse.json({error:"Concurso inválido"},{status:400});
 try{
  const podium=await readPodium(parsed.data.contestId);
  if(podium.unresolved.length)return NextResponse.json({error:"Hay empates pendientes",unresolved:podium.unresolved},{status:409});
  const {error}=await serverDatabase().rpc("finalize_contest_rounds",{p_contest_id:parsed.data.contestId});
  if(error)throw error;
  return NextResponse.json({readyForReveal:true},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"No se pudo finalizar el concurso"},{status:409});}
}
