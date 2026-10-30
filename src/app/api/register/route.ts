import { randomBytes, createHash, randomUUID } from "node:crypto";
import sharp from "sharp";
import { NextResponse } from "next/server";
import { RegisterEntry } from "@/application/use-cases/register-entry";
import { SupabaseContestRepository } from "@/infrastructure/supabase/contest-repository";
import { SupabaseRegistrationRepository } from "@/infrastructure/supabase/registration-repository";
import { serverDatabase } from "@/infrastructure/supabase/server";
import { validateDisplayName } from "@/domain/services/registration";

export const runtime = "nodejs";
const MAX_FILE_SIZE = 5_000_000;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
type ErrorCode = "FILE_TOO_LARGE" | "INVALID_FILE_TYPE" | "INVALID_FILE" | "IMAGE_PROCESSING_ERROR" |
  "REGISTRATION_CLOSED" | "INVALID_NAME" | "INVALID_CONTEST" | "PHOTO_STORAGE_ERROR" | "REGISTRATION_ERROR" | "UPLOAD_ERROR";
const messages: Record<ErrorCode, string> = {
  FILE_TOO_LARGE: "La fotografía supera el límite de 5 MB. Reduce su tamaño o calidad e inténtalo de nuevo. También puedes probar desde una computadora.",
  INVALID_FILE_TYPE: "El formato no es compatible. Selecciona una imagen JPG, PNG o WebP. Si usas iPhone, exporta la foto como JPG antes de subirla.",
  INVALID_FILE: "No se pudo leer la fotografía. Selecciona otra imagen e inténtalo de nuevo.",
  IMAGE_PROCESSING_ERROR: "No pudimos procesar esta imagen. Prueba con una versión de menor resolución o expórtala como JPG. También puedes intentar desde una computadora.",
  REGISTRATION_CLOSED: "Las inscripciones del concurso ya están cerradas.",
  INVALID_NAME: "El nombre debe tener entre 2 y 80 caracteres.",
  INVALID_CONTEST: "No encontramos el concurso. Actualiza la página e inténtalo de nuevo.",
  PHOTO_STORAGE_ERROR: "No pudimos guardar la fotografía. Inténtalo de nuevo; si estás en un teléfono, prueba desde una computadora.",
  REGISTRATION_ERROR: "No pudimos completar el registro. Inténtalo de nuevo en unos momentos.",
  UPLOAD_ERROR: "No fue posible recibir la fotografía. Comprueba tu conexión, reduce el tamaño de la imagen o intenta desde una computadora."
};
function failure(code: ErrorCode, status: number, requestId: string) {
  return NextResponse.json({ code, error: messages[code], requestId }, { status, headers: { "Cache-Control": "no-store" } });
}
export async function POST(request: Request) {
  const requestId = randomUUID();
  let imagePath: string | null = null;
  let uploaded = false;
  let stage = "receive";
  try {
    let form: FormData;
    try { form = await request.formData(); }
    catch (error) {
      console.error("Photo registration: multipart parse failed", { requestId, stage, error });
      return failure("UPLOAD_ERROR", 400, requestId);
    }
    const contestId = String(form.get("contestId") ?? "");
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contestId)) return failure("INVALID_CONTEST", 400, requestId);
    let name: string;
    try { name = validateDisplayName(String(form.get("name") ?? "")); }
    catch { return failure("INVALID_NAME", 400, requestId); }
    const file = form.get("photo");
    if (!(file instanceof File) || !file.size) return failure("INVALID_FILE", 400, requestId);
    if (file.size > MAX_FILE_SIZE) return failure("FILE_TOO_LARGE", 413, requestId);
    if (!ACCEPTED_TYPES.includes(file.type)) return failure("INVALID_FILE_TYPE", 415, requestId);

    stage = "contest";
    const contest = await new SupabaseContestRepository().findById(contestId);
    if (!contest || contest.phase !== "registration" || new Date() >= contest.registrationEndsAt) return failure("REGISTRATION_CLOSED", 409, requestId);

    stage = "process";
    let image: Buffer;
    try {
      image = await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 20_000_000 })
        .rotate().resize({ width: 1400, height: 1400, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 }).toBuffer();
    } catch (error) {
      console.error("Photo registration: image processing failed", { requestId, stage, error });
      return failure("IMAGE_PROCESSING_ERROR", 422, requestId);
    }

    imagePath = `${contestId}/${randomUUID()}.webp`;
    stage = "storage";
    const db = serverDatabase();
    const upload = await db.storage.from("contest-photos").upload(imagePath, image, { contentType: "image/webp", upsert: false });
    if (upload.error) {
      console.error("Photo registration: storage failed", { requestId, stage, error: upload.error });
      return failure("PHOTO_STORAGE_ERROR", 503, requestId);
    }
    uploaded = true;

    stage = "database";
    const code = randomBytes(12).toString("base64url");
    const codeHash = createHash("sha256").update(code).digest("hex");
    await new RegisterEntry(new SupabaseContestRepository(), new SupabaseRegistrationRepository())
      .execute({ contestId, name, imagePath, codeHash });
    uploaded = false;
    return NextResponse.json({ code }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Photo registration: failed", { requestId, stage, error });
    return failure(stage === "storage" ? "PHOTO_STORAGE_ERROR" : stage === "receive" ? "UPLOAD_ERROR" : "REGISTRATION_ERROR", 503, requestId);
  } finally {
    if (uploaded && imagePath) {
      try {
        const { error } = await serverDatabase().storage.from("contest-photos").remove([imagePath]);
        if (error) console.error("Photo registration: cleanup failed", { requestId, error });
      } catch (error) {
        console.error("Photo registration: cleanup exception", { requestId, error });
      }
    }
  }
}
