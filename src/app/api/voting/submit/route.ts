import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { serverDatabase } from "@/infrastructure/supabase/server";
export async function POST(request:Request){
 try {
  const body=await request.json();
  const {code,roundId,rankedIds}=body??{};
  if(typeof code!=="string" || code.length<12 || code.length>256 ||
    typeof roundId!=="string" || !/^[0-9a-f-]{36}$/i.test(roundId) ||
    !Array.isArray(rankedIds) || rankedIds.length>1000 ||
    rankedIds.some((id:unknown)=>typeof id!=="string" || !/^[0-9a-f-]{36}$/i.test(id)))
    return NextResponse.json({error:"Datos de votación inválidos."},{status:400});
  const hash=createHash("sha256").update(code).digest("hex");
  const {error}=await serverDatabase().rpc("submit_ranked_ballot",{
    p_round_id:roundId,p_code_hash:hash,p_ranked_entry_ids:rankedIds
  });
  if(error){
    const expected=["ALREADY_VOTED","VOTING_CLOSED","INVALID_CODE","INCOMPLETE_RANKING","INSUFFICIENT_CANDIDATES","ROUND_NOT_FOUND"];
    const key=expected.find(k=>error.message.includes(k));
    return NextResponse.json({error:key??"No fue posible registrar el voto."},{status:key==="INVALID_CODE"?401:409});
  }
  return NextResponse.json({ok:true,message:"Voto registrado. No puede modificarse."},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"No fue posible registrar el voto."},{status:503});}
}
