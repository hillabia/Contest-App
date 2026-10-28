import {NextResponse} from "next/server";
import {requireAdmin} from "@/infrastructure/auth/admin-session";
import {serverDatabase} from "@/infrastructure/supabase/server";
export const dynamic="force-dynamic";
export async function GET(request:Request){
 if(!await requireAdmin(request)) return NextResponse.json({error:"No autorizado"},{status:401});
 try{
  const db=serverDatabase();
  const {data:contest,error}=await db.from("contests").select("id,title,status,registration_ends_at,voting_ends_at").neq("status","purged").order("created_at",{ascending:false}).limit(1).maybeSingle();
  if(error)throw error;
  if(!contest)return NextResponse.json({contest:null,entries:[],rounds:[]},{headers:{"Cache-Control":"no-store"}});
  const [entries,rounds]=await Promise.all([
   db.from("entries").select("id,name,status,created_at,image_path").eq("contest_id",contest.id).order("created_at",{ascending:true}),
   db.from("voting_rounds").select("id,round_number,kind,status,starts_at,ends_at").eq("contest_id",contest.id).order("round_number",{ascending:false})
  ]);
  if(entries.error||rounds.error)throw new Error("No se pudo consultar el concurso");
  return NextResponse.json({contest,entries:entries.data??[],rounds:rounds.data??[]},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"No se pudo recuperar el concurso."},{status:503});}
}
