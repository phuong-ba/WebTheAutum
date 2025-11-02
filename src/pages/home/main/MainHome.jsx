import Banner from "@/layouts/user/Banner";
import React from "react";
import ProductNew from "../ProductNew";

export default function MainHome() {
  return (
    <>
      <div className="flex flex-col gap-12">
        <Banner />
        <ProductNew />
      </div>
    </>
  );
}
