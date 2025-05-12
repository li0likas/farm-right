import { Metadata } from "next";
import ClientLayout from "./ClientLayout";

export const metadata: Metadata = {
    title: "ŽŪVS",
    description: "ŽŪVS – žemės ūkio valdymo sistema",
    robots: { index: false, follow: false },
    viewport: { initialScale: 1, width: "device-width" },
    openGraph: {
        type: "website",
        title: "ŽŪVS",
        url: "https://zuvs.lt/",
        description: "ŽŪVS – žemės ūkio valdymo sistema",
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