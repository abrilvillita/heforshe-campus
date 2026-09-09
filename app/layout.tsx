import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'HeForShe · Entre nos',description:'Un blog universitario para escuchar, aprender y construir igualdad. Prototipo de comunidad.'};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="es"><body>{children}</body></html>}
