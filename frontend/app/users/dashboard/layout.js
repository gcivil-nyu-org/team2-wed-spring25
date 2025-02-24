import ProtectedLayout from "@/app/custom-components/LayoutWrapper";
export default function DashboardLayout({ children }) {
    return (
        <ProtectedLayout>
            <main className="dashboard-layout">
                {children}
            </main>
        </ProtectedLayout>
    )
}