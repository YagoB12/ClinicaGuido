// components/layout/AppLayout.tsx
import React from "react";
import AppNavbar from "./AppNavbar";

type Props = { title?: string; children: React.ReactNode };

export default function AppLayout({ title, children }: Props) {
  return (
    <div className="page-container">
      <AppNavbar />
      <main className="content">
        {title && (
          <div className="header-box">
            <h1 className="header-title">{title}</h1>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
