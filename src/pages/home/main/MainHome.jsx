import React from "react";

import ListCategory from "../category/ListCategory";
import FillterProduct from "../productUser/FillterProduct";
import BannerMid from "./BannerMid";
import ProductSale from "../productUser/ProductSale";
import ProductBestSeller from "../productUser/ProductBestSeller";

export default function MainHome() {
  return (
    <>
      <div className="flex flex-col ">
        <div className=" flex flex-col gap-20">
          <ListCategory />
          <FillterProduct />
          <ProductBestSeller />
          <BannerMid />
          <ProductSale />
        </div>
      </div>
    </>
  );
}
