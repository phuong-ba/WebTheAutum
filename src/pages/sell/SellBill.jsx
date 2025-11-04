import { TrashIcon } from "@phosphor-icons/react";
import Search from "antd/es/input/Search";
import React, { useState } from "react";

export default function SellBill() {
  const [bills, setBills] = useState([

  ]);

  const onSearch = (value, _e, info) => console.log(info?.source, value);

  const handleCreateBill = () => {
    const newBill = {
      id: Date.now(),
      name: `HD_${Math.floor(Math.random() * 1000)}`,
      status: "Chờ xử lý",
      productCount: 0,
    };
    setBills((prev) => [...prev, newBill]);
  };

  const handleDeleteBill = (id) => {
    setBills((prev) => prev.filter((bill) => bill.id !== id));
  };

  return (
    <>
      <div className="bg-white py-5 px-4 flex flex-col gap-3 rounded-lg shadow overflow-hidden h-full">
        <div className="flex gap-3  p-2 items-center">
          <Search placeholder="Tìm kiếm hóa đơn..." onSearch={onSearch} />
          <div
            className="font-bold text-sm py-2 px-4 min-w-[120px] cursor-pointer select-none text-center rounded-md bg-[#E67E22] text-white hover:bg-amber-600 active:bg-cyan-800 shadow"
            onClick={handleCreateBill}
          >
            Tạo hóa đơn
          </div>
        </div>

        <div className="shadow overflow-hidden rounded-lg min-h-[160px]  m-2">
          <div className="p-4 font-bold text-2xl bg-amber-600 opacity-75 rounded-t-lg text-white">
            Hóa đơn chờ
          </div>
          <div className="grid grid-cols-4 xl:grid-cols-4 lg:grid-cols-2 md:grid-cols-1 gap-5 py-4 px-5 ">
            {bills.map((bill) => (
              <div
                key={bill.id}
                className="border-2 border-amber-600 opacity-75 bg-emerald-50 rounded px-4 py-4 flex flex-col gap-3 min-w-[200px]"
              >
                <div className="flex items-center gap-2 justify-between">
                  <div className="font-semibold">{bill.name}</div>
                  <div className="text-xs bg-amber-600 text-white rounded px-4 font-semibold">
                    {bill.status}
                  </div>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <div className="font-semibold text-gray-500 text-sm">
                    {bill.productCount} sản phẩm
                  </div>
                  <div
                    className="border border-red-700 p-2 rounded cursor-pointer"
                    onClick={() => handleDeleteBill(bill.id)}
                  >
                    <TrashIcon
                      size={16}
                      weight="bold"
                      className="text-red-800"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
