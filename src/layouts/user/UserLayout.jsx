import React from "react";
import { Outlet } from "react-router";
import HeaderUser from "./HeaderUser";
import FooterUser from "./FooterUser";
import Banner from "./Banner";

export default function UserLayout() {
  return (
    <div className="min-h-screen">
      <div className="px-20">
        <HeaderUser />
        <div className="overflow-auto">
          <Outlet />
        </div>
      </div>
      <FooterUser />
    </div>
  );
}
