import React from "react";
import { Link } from "react-router";

export default function ProductNew() {
  return (
    <>
      <div className="flex flex-col  gap-8">
        <div className="flex flex-col items-center gap-8">
          <div className="font-bold text-2xl">NEW ARRIVAL</div>
          <div className="flex gap-10">
            <Link>Danh Mục 1</Link>
            <Link>Danh Mục 1</Link>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-5">
          <div>
            <div>
              <div className=" rounded-tr-2xl max-w-16 p-1 text-center font-bold bg-[#e7973e]">NEW</div>
              <div className="content-[``] max-w-2 h-5  border-t-[17px] border-l-[9px] border-t-red-500 border-l-transparent"></div>
            </div>
            <div className="min-w-[330px] bg-amber-200 max-h-[500px] min-h-[500px] ">
              s
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
