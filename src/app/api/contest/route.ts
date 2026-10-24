import { NextResponse } from "next/server";
import { serverDatabase } from "@/infrastructure/supabase/server";
export const dynamic="force-dynamic";
export async function GET(){
 try{
  const {data,error}=await serverDatabase().from("contests").select("id,title,status,registration_ends_at,voting_ends_at").neq("status","purged").order("created_at",{ascending:false}).limit(1).maybeSingle();
  if(error) throw error;
  return NextResponse.json({contest:data},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"Concurso no disponible"},{status:503});}
}
