
import "../styles/globals.css"; import type {Metadata} from "next"; import Navbar from "@/components/navbar"; import Footer from "@/components/footer";
export const metadata:Metadata={title:"Tripelor | Travel Beautifully",description:"Tripelor offers curated travel packages, luxury escapes, island holidays, and memorable journeys around the world."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><Navbar/><main>{children}</main><Footer/></body></html>}
