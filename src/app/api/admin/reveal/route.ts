import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/infrastructure/auth/admin-session";
const schema=z.object({contestId:z.string().uuid()});
export async function POST(request:Request){
 if(!await requireAdmin(request))return NextResponse.json({error:"No autorizado"},{status:401});
 let parsed;try{parsed=schema.safeParse(await request.json());}catch{return NextResponse.json({error:"JSON inválido"},{status:400});}
 if(!parsed.success)return NextResponse.json({error:"Concurso inválido"},{status:400});
 // Do not reveal until server-side podium ties have been resolved.
 return NextResponse.json({error:"La revelación requiere verificar que no queden empates; todavía no está habilitada."},{status:501});
}
