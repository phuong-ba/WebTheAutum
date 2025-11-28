import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router";
import HeaderUser from "./HeaderUser";
import FooterUser from "./FooterUser";
import Banner from "./Banner";

import Advise from "./Advise";

import Chatbox from "@/components/Chatbox/CustomerChat";
export default function UserLayout() {
  const [isFixed, setIsFixed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 120) {
        setIsFixed(true);
      } else {
        setIsFixed(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <div
        className={`${
          isFixed
            ? "fixed top-0 left-0 right-0 z-50 bg-white shadow animate-slideDown"
            : "relative  shadow"
        } transition-all`}
      >
        <div className="px-40">
          <HeaderUser />
        </div>
      </div>

      {location.pathname === "/" && <Banner />}

      <div className="flex-1 py-[60px] px-40 overflow-auto ">
        <Outlet />
        {/* <Chatbox /> */}
      </div>

      <Advise />
      <div className="bg-gray-50">
        <FooterUser />
      </div>
    </div>
  );
}
