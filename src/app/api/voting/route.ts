import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { serverDatabase } from "@/infrastructure/supabase/server";
export const dynamic="force-dynamic";
export async function POST(request:Request){
 try {
  const body=await request.json();
  const code=body?.code, roundId=body?.roundId;
  if(typeof code!=="string" || code.length<12 || code.length>256 ||
     typeof roundId!=="string" || !/^[0-9a-f-]{36}$/i.test(roundId))
    return NextResponse.json({error:"Código o ronda inválidos."},{status:400});
  const hash=createHash("sha256").update(code).digest("hex");
  const db=serverDatabase();
  const {data:round,error:roundError}=await db.from("voting_rounds")
    .select("id,contest_id,kind,status,starts_at,ends_at,contests(status,voting_ends_at)")
    .eq("id",roundId).maybeSingle();
  if(roundError) throw roundError;
  if(!round || round.status!=="open" || new Date()<new Date(round.starts_at) || new Date()>=new Date(round.ends_at))
    return NextResponse.json({error:"No hay una votación abierta."},{status:409});
  const {data:access,error:accessError}=await db.from("access_codes")
    .select("id,entry_id").eq("contest_id",round.contest_id).eq("code_hash",hash).maybeSingle();
  if(accessError) throw accessError;
  if(!access) return NextResponse.json({error:"Código no válido."},{status:401});
  const {data:existing,error:existingError}=await db.from("ballots")
    .select("id").eq("round_id",roundId).eq("access_code_id",access.id).maybeSingle();
  if(existingError) throw existingError;
  if(existing) return NextResponse.json({error:"Este código ya votó en esta ronda."},{status:409});
  const {data:rows,error:rowsError}=await db.from("round_entries")
    .select("entry_id,entries!inner(status,contest_id)")
    .eq("round_id",roundId);
  if(rowsError) throw rowsError;
  const eligible=(rows??[]).filter(row=>row.entry_id!==access.entry_id)
    .map(row=>row.entry_id).sort();
  if(eligible.length<2) return NextResponse.json({error:"No hay suficientes fotografías elegibles para votar."},{status:409});
  return NextResponse.json({roundId,photos:eligible.map(id=>({id})),message:"Ordena todas las fotografías y envía tu voto."},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"No fue posible consultar la votación."},{status:503});}
}
