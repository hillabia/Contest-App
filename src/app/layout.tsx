import type { ReactNode } from "react";
export const metadata = {title:"Contest App",description:"Open-source photo contest platform"};
export default function RootLayout({children}:{children:ReactNode}) {
  return <html lang="es"><body>{children}</body></html>;
}
