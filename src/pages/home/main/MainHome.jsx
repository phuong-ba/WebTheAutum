import Banner from "@/layouts/user/Banner";
import React from "react";
import ProductNew from "../ProductNew";
import ProductSeller from "../ProductSeller";
import ProductCollection from "../ProductCollection";
import ProductBigSale from "../ProductBigSale";
import Advise from "@/layouts/user/Advise";

export default function MainHome() {
  return (
    <>
      <div className="flex flex-col ">
        <Banner />
        <div className="py-10 flex flex-col gap-10">
          <ProductNew />
          <ProductSeller />
          <ProductCollection />
          <ProductBigSale />
          <Advise/>
        </div>
      </div>
    </>
  );
}
