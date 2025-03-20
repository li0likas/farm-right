import { Metadata } from "next";
import ClientLayout from "./ClientLayout";

export const metadata: Metadata = {
    title: "PrimeReact Sakai",
    description: "The ultimate collection of design-agnostic, flexible and accessible React UI Components.",
    robots: { index: false, follow: false },
    viewport: { initialScale: 1, width: "device-width" },
    openGraph: {
        type: "website",
        title: "PrimeReact SAKAI-REACT",
        url: "https://sakai.primereact.org/",
        description: "The ultimate collection of design-agnostic, flexible and accessible React UI Components.",
        images: ["https://www.primefaces.org/static/social/sakai-react.png"],
        ttl: 604800,
    },
    icons: {
        icon: "/favicon.ico",
    },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return <ClientLayout>{children}</ClientLayout>;
}


// 'use client';

// import { Metadata } from "next";
// import Layout from "../../layout/layout";
// import { PermissionsProvider, usePermissions } from "@/context/PermissionsContext";
// import { ProgressSpinner } from "primereact/progressspinner";

// interface AppLayoutProps {
//     children: React.ReactNode;
// }

// export const metadata: Metadata = {
//     title: "PrimeReact Sakai",
//     description: "The ultimate collection of design-agnostic, flexible and accessible React UI Components.",
//     robots: { index: false, follow: false },
//     viewport: { initialScale: 1, width: "device-width" },
//     openGraph: {
//         type: "website",
//         title: "PrimeReact SAKAI-REACT",
//         url: "https://sakai.primereact.org/",
//         description: "The ultimate collection of design-agnostic, flexible and accessible React UI Components.",
//         images: ["https://www.primefaces.org/static/social/sakai-react.png"],
//         ttl: 604800,
//     },
//     icons: {
//         icon: "/favicon.ico",
//     },
// };

// // Wrapper to ensure layout waits for permissions to load before loading page
// const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
//     const { loading } = usePermissions(); // Get global loading state

//     if (loading) {
//         return (
//             <div className="flex justify-center items-center min-h-screen">
//                 <ProgressSpinner />
//             </div>
//         );
//     }

//     return <Layout>{children}</Layout>;
// };

// export default function AppLayout({ children }: AppLayoutProps) {
//     return (
//         <PermissionsProvider>
//             <LayoutWrapper>{children}</LayoutWrapper>
//         </PermissionsProvider>
//     );
// }
