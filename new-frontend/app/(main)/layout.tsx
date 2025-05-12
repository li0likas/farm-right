import { Metadata } from "next";
import ClientLayout from "./ClientLayout";

export const metadata: Metadata = {
    title: "ŽŪVS - Ūkio Valdymo Sistema",
    description: "ŽŪVS - Modernūs ūkio valdymo sprendimai",
    robots: { index: false, follow: false },
    viewport: { initialScale: 1, width: "device-width" },
    openGraph: {
        type: "website",
        title: "ŽŪVS - Ūkio Valdymo Sistema",
        url: "https://zuvs.lt/",
        description: "ŽŪVS - Modernūs ūkio valdymo sprendimai",
        images: ["/images/og-image.png"], // Update with your actual image
        ttl: 604800,
    },
    icons: {
        icon: "/favicon.ico",
    },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return <ClientLayout>{children}</ClientLayout>;
}