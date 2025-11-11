import React from "react";
import { Outlet } from "react-router";
import HeaderUser from "./HeaderUser";
import FooterUser from "./FooterUser";
import Banner from "./Banner";
import Chatbox from "@/components/Chatbox/Chatbox";
export default function UserLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow">
        <div className="px-20">
          <HeaderUser />
        </div>
      </div>

      <div className="flex-1 pt-[90px] px-20 overflow-auto">
        <Outlet />
        <Chatbox />
      </div>

      <FooterUser />
    </div>
  );
}
