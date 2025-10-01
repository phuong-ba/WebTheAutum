import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import { Outlet } from "react-router";
import Navbar from "./Navbar";

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen">
      <Navbar className="h-screen" />

      <div className="flex flex-col flex-1">
        <Header />

        <div className="flex-1 bg-[#f3f3f9] overflow-auto">
          <Outlet />
        </div>

        <Footer />
      </div>
    </div>
  );
}
