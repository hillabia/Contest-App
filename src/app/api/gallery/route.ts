import { NextResponse } from "next/server";
import { SupabaseRegistrationRepository } from "@/infrastructure/supabase/registration-repository";
import { serverDatabase } from "@/infrastructure/supabase/server";
export const dynamic = "force-dynamic";
export async function GET(request:Request) {
  const contestId = new URL(request.url).searchParams.get("contestId")??"";
  if(!/^[0-9a-f-]{36}$/i.test(contestId)) return NextResponse.json({error:"Invalid contest"},{status:400});
  try {
    const entries = await new SupabaseRegistrationRepository().listPublicImages(contestId);
    const db = serverDatabase();
    const photos = await Promise.all(entries.map(async entry=>{
      const {data,error}=await db.storage.from("contest-photos").createSignedUrl(entry.imagePath,60);
      return error?null:{id:entry.id,url:data.signedUrl};
    }));
    return NextResponse.json({photos:photos.filter(Boolean)},{headers:{"Cache-Control":"no-store"}});
  } catch {
    return NextResponse.json({error:"Galería no disponible"},{status:503});
  }
}
