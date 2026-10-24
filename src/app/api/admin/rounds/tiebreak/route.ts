import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/infrastructure/auth/admin-session";
import { serverDatabase } from "@/infrastructure/supabase/server";
const schema=z.object({contestId:z.string().uuid(),entryIds:z.array(z.string().uuid()).min(2).max(100),durationMinutes:z.number().int().min(5).max(10080)});
export async function POST(request:Request){
 if(!await requireAdmin(request))return NextResponse.json({error:"No autorizado"},{status:401});
 let parsed;try{parsed=schema.safeParse(await request.json());}catch{return NextResponse.json({error:"JSON inválido"},{status:400});}
 if(!parsed.success)return NextResponse.json({error:"Datos inválidos"},{status:400});
 const {contestId,entryIds,durationMinutes}=parsed.data;
 if(new Set(entryIds).size!==entryIds.length)return NextResponse.json({error:"Fotografías repetidas"},{status:400});
 // Before enabling production, tie membership must be independently verified against persisted results.
 return NextResponse.json({error:"La creación del desempate requiere verificación de empates del servidor; todavía no está habilitada.",contestId},{status:501});
}
