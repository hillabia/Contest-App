export function validateDisplayName(input: string): string {
  const name = input.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 80 || /[<>\x00-\x1f]/.test(name)) {
    throw new Error("El nombre debe tener entre 2 y 80 caracteres.");
  }
  return name;
}
export function canRegister(now: Date, registrationEndsAt: Date, phase: string): boolean {
  return phase === "registration" && now.getTime() < registrationEndsAt.getTime();
}
