import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import { Outlet } from "react-router";
import Navbar from "./Navbar";
import LoginSuccessNotification from "@/pages/auth/LoginSuccessNotification";
import ShiftCheckMiddleware from "@/pages/shift/ShiftCheckMiddleware";
import { ShiftProvider } from "@/contexts/ShiftContext";

export default function AdminLayout() {
  return (
    <ShiftProvider>
      <div className="flex min-h-screen">
        <LoginSuccessNotification />
        <Navbar className="h-screen" />

        <div className="flex flex-col flex-1">
          <Header />

          <div className="flex-1 bg-[#f3f3f9] overflow-auto">
            <ShiftCheckMiddleware>
              <Outlet />
            </ShiftCheckMiddleware>
          </div>
          <Footer />
        </div>
      </div>
    </ShiftProvider>
  );
}
