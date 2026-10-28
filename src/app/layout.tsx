import type { ReactNode } from "react";
import "./globals.css";
export const metadata = {title:"Contest App | Halloween",description:"Concurso de fotografía de Halloween: participa y vota."};
export default function RootLayout({children}:{children:ReactNode}) {
 return <html lang="es"><body>{children}</body></html>;
}
