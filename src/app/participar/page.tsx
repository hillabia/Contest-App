"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";

const MAX_FILE_SIZE = 5_000_000;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const guidance = "Puedes reducir la resolución o calidad de la foto, guardarla como JPG o intentar subirla desde una computadora.";

async function compressPhoto(file: File): Promise<File> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new Error("Formato no compatible. Usa JPG, PNG o WebP. Si tu teléfono utiliza HEIC, expórtala como JPG.");
  }
  // Keep smaller files untouched; the server still normalizes them.
  if (file.size <= 2_500_000) return file;
  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const maxSide = 1600;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("No se pudo procesar la fotografía en este navegador.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const toBlob = (quality: number) => new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", quality));
    for (const quality of [0.82, 0.68, 0.5]) {
      const blob = await toBlob(quality);
      if (blob && blob.size < MAX_FILE_SIZE) {
        return new File([blob], file.name.replace(/\.[^.]+$/, "") + "-optimizada.jpg", { type: "image/jpeg" });
      }
    }
    throw new Error("La fotografía sigue siendo demasiado grande. Reduce su tamaño o inténtalo desde una computadora.");
  } finally {
    bitmap?.close();
  }
}

export default function Participate() {
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [requestId, setRequestId] = useState("");
  const [status, setStatus] = useState("");

  function onFileChange(file: File | null) {
    setPhoto(file); setError(""); setErrorCode(""); setRequestId(""); setStatus("");
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Elige una fotografía JPG, PNG o WebP. Si tu teléfono usa HEIC, expórtala como JPG.");
      setErrorCode("INVALID_FILE_TYPE");
    } else if (file.size > MAX_FILE_SIZE) {
      setStatus("La foto es grande. Intentaremos comprimirla automáticamente antes de subirla.");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError(""); setErrorCode(""); setRequestId(""); setStatus("");
    if (!photo) { setError("Selecciona una fotografía."); return; }
    if (!ACCEPTED_TYPES.includes(photo.type)) { setErrorCode("INVALID_FILE_TYPE"); setError("Elige una fotografía JPG, PNG o WebP. Si utilizas HEIC, expórtala como JPG."); return; }
    setBusy(true);
    try {
      let prepared: File;
      try {
        setStatus("Preparando fotografía...");
        prepared = await compressPhoto(photo);
      } catch (e) {
        setErrorCode("IMAGE_PROCESSING_ERROR");
        throw new Error(e instanceof Error ? e.message : "No se pudo optimizar esta fotografía. " + guidance);
      }
      if (prepared.size > MAX_FILE_SIZE) {
        setErrorCode("FILE_TOO_LARGE");
        throw new Error("La fotografía supera los 5 MB permitidos incluso después de optimizarla. " + guidance);
      }
      setStatus("Subiendo fotografía...");
      const contestResponse = await fetch("/api/contest", { cache: "no-store" });
      if (!contestResponse.ok) { setErrorCode("SERVICE_UNAVAILABLE"); throw new Error("No pudimos consultar el concurso. Inténtalo en unos minutos."); }
      const { contest } = await contestResponse.json();
      if (!contest || contest.status !== "registration") { setErrorCode("REGISTRATION_CLOSED"); throw new Error("Las inscripciones del concurso no están abiertas."); }
      const form = new FormData();
      form.set("contestId", contest.id); form.set("name", name); form.set("photo", prepared);
      const response = await fetch("/api/register", { method: "POST", body: form });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setRequestId(typeof data?.requestId === "string" ? data.requestId : "");
        setErrorCode(typeof data?.code === "string" ? data.code : response.status === 413 ? "FILE_TOO_LARGE" : response.status >= 500 ? "SERVICE_UNAVAILABLE" : "UPLOAD_ERROR");
        if (response.status === 413) throw new Error("La fotografía supera el tamaño permitido. " + guidance);
        if ([502, 503, 504].includes(response.status)) throw new Error("El servicio está temporalmente ocupado. Inténtalo en unos minutos.");
        throw new Error(typeof data?.error === "string" ? data.error : "No fue posible subir la fotografía. " + guidance);
      }
      setCode(data.code); setStatus("");
    } catch (e) {
      if (e instanceof TypeError) setErrorCode("NETWORK_ERROR");
      setError(e instanceof TypeError ? "No pudimos conectar con el servidor. Revisa tu conexión. Si continúa, prueba desde una computadora." : e instanceof Error ? e.message : "Error inesperado al registrar la fotografía.");
      setStatus("");
    } finally { setBusy(false); }
  }
  return <main style={{ maxWidth: 560, margin: "3rem auto", padding: "1rem", fontFamily: "sans-serif" }}>
    <Link href="/">← Inicio</Link><h1>Participar</h1>
    {code ? <section><h2>Registro completado</h2><p>Guarda este código. No volverá a mostrarse.</p><strong style={{ overflowWrap: "anywhere" }}>{code}</strong></section> :
      <form onSubmit={submit}>
        <p><label>Nombre<br/><input required minLength={2} maxLength={80} value={name} onChange={e => setName(e.target.value)} disabled={busy}/></label></p>
        <p><label>Fotografía (JPG, PNG o WebP)<br/><input type="file" accept="image/jpeg,image/png,image/webp" required disabled={busy} onChange={e => onFileChange(e.target.files?.[0] ?? null)}/></label></p>
        <p style={{ fontSize: 14 }}>Las fotografías grandes se comprimen automáticamente en tu dispositivo antes de subirlas. El límite final es de 5 MB. Si tu foto está en HEIC, expórtala como JPG.</p>
        {status && <p role="status">{status}</p>}
        <button disabled={busy || errorCode === "INVALID_FILE_TYPE"} type="submit">{busy ? "Procesando..." : "Registrar fotografía"}</button>
      </form>}
    {error && <div role="alert" style={{ border: "1px solid #d97706", padding: 12, borderRadius: 8, marginTop: 16 }}>
      <strong>No se pudo subir la fotografía</strong><p>{error}</p>
      {errorCode && <small>Código: {errorCode}</small>}
      {requestId && <p style={{ fontSize: 12 }}>Referencia para soporte: {requestId}</p>}
    </div>}
  </main>;
}
