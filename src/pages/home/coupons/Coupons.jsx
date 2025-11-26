import React from "react";
import ClientBreadcrumb from "../ClientBreadcrumb";
import logo from "/src/assets/login/logo.png";

const coupons = [
  {
    id: 1,
    title: "August Gift Voucher",
    percent: 10,
    code: "AUGUST23",
    img: logo,
  },
  {
    id: 2,
    title: "May Day",
    percent: 20,
    code: "MAYDAY",
    img: logo,
  },
  {
    id: 3,
    title: "Fifty Fifty",
    percent: 50,
    code: "FIF50",
    img: logo,
  },
  {
    id: 4,
    title: "SUMMER Vacation",
    percent: 15,
    code: "SUMMER15",
    img:logo,
  },
  {
    id: 5,
    title: "Paper On Demand",
    percent: 12,
    code: "PAPER12",
    img:logo,
  },
  {
    id: 6,
    title: "Flash Sale",
    percent: 30,
    code: "FLASH30",
    img:logo,
  },
];

export default function Coupons() {
  return (
    <div className="px-10 py-6">
      <div className="mb-6">
        <div className="text-3xl font-bold">Nhận ưu đãi tốt nhất</div>
        <ClientBreadcrumb />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {coupons.map((item) => (
          <div
            key={item.id}
            className="flex bg-white shadow rounded-xl border overflow-hidden relative"
          >
            <div className="flex p-5 gap-5 flex-[7] items-center min-w-0">
              <img
                src={item.img}
                alt={item.title}
                className="w-28 h-28 object-contain flex-shrink-0"
              />
              <div className="min-w-0">
                <div className="font-bold text-lg truncate">{item.title}</div>
                <div className="font-semibold text-red-500 text-xl">
                  {item.percent}% Off
                </div>

                <div className="flex gap-4 mt-3 text-xs text-gray-500">
                  {["DAY", "HRS", "MIN", "SEC"].map((label, i) => (
                    <div key={i} className="text-center">
                      <div>0</div>
                      <div>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="absolute left-[60%] top-0 bottom-0 border-l border-dashed border-gray-300"></div>

            <div className="flex flex-col justify-center flex-[3] px-6">
              <div className="text-sm text-gray-600 mb-2">
                Coupon:{" "}
                <span className="text-green-600 font-semibold">Active</span>
              </div>
              <div className="border border-dashed px-5 py-3 rounded-md font-bold text-green-700 tracking-widest cursor-pointer bg-green-50 hover:bg-green-100 truncate">
                {item.code}
              </div>
            </div>

            <div className="absolute left-[60%] -translate-x-1/2 -top-3 w-6 h-6 rounded-full bg-white border border-gray-300"></div>
            <div className="absolute left-[60%] -translate-x-1/2 -bottom-3 w-6 h-6 rounded-full bg-white border border-gray-300"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
