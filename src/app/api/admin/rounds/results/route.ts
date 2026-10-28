import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/infrastructure/auth/admin-session";
import { CalculateRoundResults } from "@/application/use-cases/calculate-round-results";
import { SupabaseRoundResultsReader } from "@/infrastructure/supabase/round-results-reader";
const schema=z.object({roundId:z.string().uuid()});
export async function POST(request:Request){
 if(!await requireAdmin(request))return NextResponse.json({error:"No autorizado"},{status:401});
 let parsed;
 try{parsed=schema.safeParse(await request.json());}catch{return NextResponse.json({error:"JSON inválido"},{status:400});}
 if(!parsed.success)return NextResponse.json({error:"Ronda inválida"},{status:400});
 try{
  const result=await new CalculateRoundResults(new SupabaseRoundResultsReader()).execute(parsed.data.roundId);
  return NextResponse.json(result,{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"No hay resultados disponibles para esta ronda."},{status:409});}
}
