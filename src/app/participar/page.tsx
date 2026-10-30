"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";

const MAX_FILE_SIZE = 5_000_000;
const accepted = ["image/jpeg", "image/png", "image/webp"];
const guidance = "Puedes reducir la resolución o calidad de la foto, guardarla como JPG o intentar subirla desde una computadora.";
export default function Participate() {
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [busy, setBusy] = useState(false);
  function onFileChange(file: File | null) {
    setPhoto(file); setError(""); setErrorCode("");
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setError("La fotografía supera los 5 MB permitidos. " + guidance);
      setErrorCode("FILE_TOO_LARGE");
    } else if (!accepted.includes(file.type)) {
      setError("Elige una fotografía en formato JPG, PNG o WebP. Si tu teléfono usa HEIC, convierte la imagen a JPG.");
      setErrorCode("INVALID_FILE_TYPE");
    }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError(""); setErrorCode("");
    if (!photo) { setError("Selecciona una fotografía."); return; }
    if (photo.size > MAX_FILE_SIZE) { setError("La fotografía supera los 5 MB permitidos. " + guidance); setErrorCode("FILE_TOO_LARGE"); return; }
    if (!accepted.includes(photo.type)) { setError("Elige una fotografía JPG, PNG o WebP. Convierte los archivos HEIC a JPG."); setErrorCode("INVALID_FILE_TYPE"); return; }
    setBusy(true);
    try {
      const contestResponse = await fetch("/api/contest", { cache: "no-store" });
      if (!contestResponse.ok) throw new Error("No se pudo consultar el concurso. Inténtalo nuevamente.");
      const { contest } = await contestResponse.json();
      if (!contest || contest.status !== "registration") throw new Error("No hay inscripciones abiertas.");
      const form = new FormData();
      form.set("contestId", contest.id); form.set("name", name); form.set("photo", photo);
      const response = await fetch("/api/register", { method: "POST", body: form });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setErrorCode(typeof data?.code === "string" ? data.code : "UPLOAD_ERROR");
        if (response.status === 413) throw new Error("La fotografía o solicitud supera el tamaño permitido. " + guidance);
        throw new Error(typeof data?.error === "string" ? data.error : "No fue posible subir la fotografía. " + guidance);
      }
      setCode(data.code);
    } catch (e) {
      setError(e instanceof TypeError ? "No pudimos conectar con el servidor. Revisa tu conexión e inténtalo nuevamente. Si continúa, prueba desde una computadora." : e instanceof Error ? e.message : "Error inesperado al registrar la fotografía.");
    } finally { setBusy(false); }
  }
  return <main style={{ maxWidth: 560, margin: "3rem auto", padding: "1rem", fontFamily: "sans-serif" }}>
    <Link href="/">← Inicio</Link><h1>Participar</h1>
    {code ? <section><h2>Registro completado</h2><p>Guarda este código. No volverá a mostrarse.</p><strong style={{ overflowWrap: "anywhere" }}>{code}</strong></section> :
      <form onSubmit={submit}>
        <p><label>Nombre<br/><input required minLength={2} maxLength={80} value={name} onChange={e => setName(e.target.value)} disabled={busy}/></label></p>
        <p><label>Fotografía (JPG, PNG o WebP, máximo 5 MB)<br/><input type="file" accept="image/jpeg,image/png,image/webp" required disabled={busy} onChange={e => onFileChange(e.target.files?.[0] ?? null)}/></label></p>
        <p style={{ fontSize: 14 }}>Si la imagen es muy grande, reduce su resolución o calidad y vuelve a intentarlo. Si tienes problemas desde el celular, prueba desde una computadora.</p>
        <button disabled={busy || !!errorCode && (errorCode === "FILE_TOO_LARGE" || errorCode === "INVALID_FILE_TYPE")} type="submit">{busy ? "Registrando..." : "Registrar fotografía"}</button>
      </form>}
    {error && <div role="alert" style={{ border: "1px solid #d97706", padding: 12, borderRadius: 8, marginTop: 16 }}>
      <strong>No se pudo subir la fotografía</strong>
      <p>{error}</p>
      {errorCode && <small>Código: {errorCode}</small>}
    </div>}
  </main>;
}
