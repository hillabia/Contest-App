import { randomBytes, createHash } from "node:crypto";
import sharp from "sharp";
import { NextResponse } from "next/server";
import { RegisterEntry } from "@/application/use-cases/register-entry";
import { SupabaseContestRepository } from "@/infrastructure/supabase/contest-repository";
import { SupabaseRegistrationRepository } from "@/infrastructure/supabase/registration-repository";
import { serverDatabase } from "@/infrastructure/supabase/server";
import { validateDisplayName } from "@/domain/services/registration";
export const runtime = "nodejs";
export async function POST(request: Request) {
  let imagePath: string | null = null;
  try {
    const form = await request.formData();
    const contestId = String(form.get("contestId") ?? "");
    const name = validateDisplayName(String(form.get("name") ?? ""));
    const file = form.get("photo");
    if (!/^[0-9a-f-]{36}$/i.test(contestId) || !(file instanceof File) || file.size === 0 || file.size > 5_000_000 || !["image/jpeg","image/png","image/webp"].includes(file.type)) {
      return NextResponse.json({error:"Datos o fotografía inválidos (máximo 5 MB)."}, {status:400});
    }
    const contest = await new SupabaseContestRepository().findById(contestId);
    if (!contest || contest.phase !== "registration" || new Date() >= contest.registrationEndsAt) return NextResponse.json({error:"Inscripciones cerradas."},{status:409});
    const image = await sharp(Buffer.from(await file.arrayBuffer()),{limitInputPixels:20_000_000}).rotate().resize({width:1400,height:1400,fit:"inside",withoutEnlargement:true}).webp({quality:82}).toBuffer();
    imagePath = `${contestId}/${crypto.randomUUID()}.webp`;
    const db = serverDatabase();
    const upload = await db.storage.from("contest-photos").upload(imagePath,image,{contentType:"image/webp",upsert:false});
    if(upload.error) throw upload.error;
    const code = randomBytes(12).toString("base64url");
    const codeHash = createHash("sha256").update(code).digest("hex");
    await new RegisterEntry(new SupabaseContestRepository(),new SupabaseRegistrationRepository()).execute({contestId,name,imagePath,codeHash});
    return NextResponse.json({code},{status:201,headers:{"Cache-Control":"no-store"}});
  } catch(e) {
    if(imagePath) await serverDatabase().storage.from("contest-photos").remove([imagePath]).catch(()=>{});
    return NextResponse.json({error:e instanceof Error && /inscripciones|nombre/i.test(e.message)?e.message:"No se pudo completar el registro."},{status:400});
  }
}
