import React, { useState, useEffect } from "react";
import SellBreadcrumb from "./SellBreadcrumb";
import SellBill from "./SellBill";
import SellCustomer from "./SellCustomer";
import SellCartProduct from "./SellCartProduct";
import SellInformation from "./SellInformation";
import SellListProduct from "./SellListProduct";

export default function Sell() {
  return (
    <>
      <div className="p-6 flex flex-col gap-5">
        <div className="bg-white flex flex-col gap-3 px-4 py-[20px] rounded-lg shadow overflow-hidden">
          <div className="font-bold text-4xl text-[#E67E22]">
            Quản lý bán hàng
          </div>
          <SellBreadcrumb />
        </div>
        <div className="flex gap-5 justify-between items-stretch ">
          <div className="flex-[2.5]">
            <SellBill />
          </div>
          <div className="flex-[1]">
            <SellCustomer />
          </div>
        </div>
        <div className="flex gap-5 justify-between">
          <div className="flex-[2.5] flex flex-col gap-5">
            <SellCartProduct />
            <SellListProduct />
          </div>
          <div className="flex-[1]">
            <SellInformation />
          </div>
        </div>
      </div>
    </>
  );
}
