import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { serverDatabase } from "@/infrastructure/supabase/server";
export const dynamic="force-dynamic";
export async function POST(request:Request){
 try {
  const body=await request.json();
  const code=body?.code;
  if(typeof code!=="string" || code.length<12 || code.length>256)
    return NextResponse.json({error:"Código inválido."},{status:400});
  const hash=createHash("sha256").update(code).digest("hex");
  const db=serverDatabase();
  const {data:access,error:accessError}=await db.from("access_codes")
    .select("id,entry_id,contest_id").eq("code_hash",hash).maybeSingle();
  if(accessError) throw accessError;
  if(!access) return NextResponse.json({error:"Código no válido."},{status:401});
  const {data:contest,error:contestError}=await db.from("contests").select("status,voting_ends_at").eq("id",access.contest_id).single();
  if(contestError) throw contestError;
  if(!["voting","tiebreak"].includes(contest.status))
    return NextResponse.json({error:"No hay una votación abierta."},{status:409});
  const {data:rounds,error:roundsError}=await db.from("voting_rounds")
    .select("id,kind,status,starts_at,ends_at").eq("contest_id",access.contest_id)
    .eq("status","open").order("round_number",{ascending:false}).limit(1);
  if(roundsError) throw roundsError;
  const round=rounds?.[0];
  const now=new Date();
  if(!round || now<new Date(round.starts_at) || now>=new Date(round.ends_at) ||
    (round.kind==="regular" && (contest.status!=="voting" || now>=new Date(contest.voting_ends_at))) ||
    (round.kind==="tiebreak" && contest.status!=="tiebreak"))
    return NextResponse.json({error:"No hay una votación abierta."},{status:409});
  const {data:existing,error:existingError}=await db.from("ballots")
    .select("id").eq("round_id",round.id).eq("access_code_id",access.id).maybeSingle();
  if(existingError) throw existingError;
  if(existing) return NextResponse.json({error:"Este código ya votó en esta ronda."},{status:409});
  const {data:rows,error:rowsError}=await db.from("round_entries")
    .select("entry_id,entries!inner(image_path,status,contest_id)")
    .eq("round_id",round.id);
  if(rowsError) throw rowsError;
  const eligible=(rows??[]).filter(row=>row.entry_id!==access.entry_id)
    .filter(row=>{const e=row.entries as unknown as {status:string;contest_id:string};return e.status==="approved" && e.contest_id===access.contest_id;});
  if(eligible.length<2) return NextResponse.json({error:"No hay suficientes fotografías elegibles para votar."},{status:409});
  const photos=await Promise.all(eligible.map(async row=>{
    const entry=row.entries as unknown as {image_path:string};
    const {data,error}=await db.storage.from("contest-photos").createSignedUrl(entry.image_path,120);
    if(error) throw error;
    return {id:row.entry_id,url:data.signedUrl};
  }));
  return NextResponse.json({roundId:round.id,photos},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"No fue posible consultar la votación."},{status:503});}
}
