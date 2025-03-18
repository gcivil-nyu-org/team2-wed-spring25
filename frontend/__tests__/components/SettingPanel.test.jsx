import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import SettingPanel from "@/app/custom-components/SettingPanel";
import SettingsSidebar from "@/app/custom-components/SettingsSidebar";

// jest.mock("@/components/ui/sidebar", () => ({
//   SidebarProvider: ({ children }) => (
//     <div data-testid="sidebar-provider">{children}</div>
//   ),
//   Sidebar: ({ children }) => <div role="complementary">{children}</div>,
//   SidebarContent: ({ children }) => <div>{children}</div>,
//   useSidebar: () => ({
//     open: false,
//     toggleSidebar: jest.fn(),
//   }),
// }));

// // Mock the next/link component
// jest.mock("next/link", () => {
//   return ({ children, href }) => {
//     return <a href={href}>{children}</a>;
//   };
// });

// describe("SettingPanel", () => {
//   it("renders without crashing", () => {
//     render(<SettingPanel />);
//     expect(screen.getByRole("complementary")).toBeInTheDocument();
//   });

//   it("toggles sidebar visibility when trigger is clicked", () => {
//     render(<SettingPanel />);
//     const trigger = screen.getByRole("button");
//     fireEvent.click(trigger);
//     // Check if sidebar is visible
//     expect(screen.getByRole("complementary")).toBeInTheDocument();
//   });
// });

// describe("SettingsSidebar", () => {
//   it("renders user avatar and username", () => {
//     render(<SettingsSidebar />);
//     expect(screen.getByText("Username")).toBeInTheDocument();
//   });

//   it("renders all navigation items", () => {
//     render(<SettingsSidebar />);
//     const navigationItems = [
//       "Profile",
//       "Routes",
//       "Report",
//       "Resources",
//       "Settings",
//       "Sign Out",
//     ];

//     navigationItems.forEach((item) => {
//       expect(screen.getByText(item)).toBeInTheDocument();
//     });
//   });

//   it("renders correct navigation links", () => {
//     render(<SettingsSidebar />);
//     expect(screen.getByRole("link", { name: /profile/i })).toHaveAttribute(
//       "href",
//       "/users/settings/profile"
//     );
//     expect(screen.getByRole("link", { name: /routes/i })).toHaveAttribute(
//       "href",
//       "/users/settings/routes"
//     );
//     expect(screen.getByRole("link", { name: /report/i })).toHaveAttribute(
//       "href",
//       "/users/settings/report"
//     );
//   });
// });
