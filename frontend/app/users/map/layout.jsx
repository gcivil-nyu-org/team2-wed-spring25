"use client"
import { RouteProvider } from "@/app/custom-components/MapComponents/RouteContext"
export default function Layout({ children }) {
    return (
        <RouteProvider>
            {children}
        </RouteProvider>
    )
}