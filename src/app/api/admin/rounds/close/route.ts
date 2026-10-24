import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/infrastructure/auth/admin-session";
import { serverDatabase } from "@/infrastructure/supabase/server";
const schema=z.object({roundId:z.string().uuid()});
export async function POST(request:Request){
 if(!await requireAdmin(request))return NextResponse.json({error:"No autorizado"},{status:401});
 let parsed;
 try{parsed=schema.safeParse(await request.json());}catch{return NextResponse.json({error:"JSON inválido"},{status:400});}
 if(!parsed.success)return NextResponse.json({error:"Ronda inválida"},{status:400});
 const {data,error}=await serverDatabase().rpc("close_voting_round",{p_round_id:parsed.data.roundId});
 if(error)return NextResponse.json({error:"No se puede cerrar la ronda todavía."},{status:409});
 return NextResponse.json({closed:true,contestId:data},{headers:{"Cache-Control":"no-store"}});
}
