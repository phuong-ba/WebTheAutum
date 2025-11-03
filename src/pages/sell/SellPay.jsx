import React from "react";

export default function SellPay() {
  return (
    <>
      <div className="bg-gray-50 p-5 rounded-lg border-l-4 border border-amber-700">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between font-bold">
              <span>Tổng tiền hàng:</span> <span>7.99999 vnd</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Giảm giá:</span>{" "}
              <span className="text-red-800">-7.99999 vnd</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Phí vận chuyển:</span> <span>0 vnd</span>
            </div>
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span>Tổng thanh toán:</span>{" "}
            <span className="text-amber-600">7.99999 vnd</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <div className="font-bold">Phương thức thanh toán:</div>
        <div className="flex gap-2">
          <div className=" cursor-pointer select-none  text-center py-2 px-6 rounded-xl bg-[#FFF] font-bold text-amber-600 hover:text-white   hover:bg-amber-600 active:bg-cyan-800 border  active:border-[#808080] active:text-white shadow">
            Chuyển khoản
          </div>
          <div className=" cursor-pointer select-none  text-center py-2 px-6 rounded-xl bg-[#FFF] font-bold text-amber-600 hover:text-white   hover:bg-amber-600 active:bg-cyan-800 border  active:border-[#808080] active:text-white shadow">
            Tiền mặt
          </div>
          <div className="cursor-pointer select-none  text-center py-2 px-6 rounded-xl bg-[#FFF] font-bold text-amber-600 hover:text-white   hover:bg-amber-600 active:bg-cyan-800 border  active:border-[#808080] active:text-white shadow">
            Cả hai
          </div>
        </div>
      </div>
      <div className="cursor-pointer select-none  text-center py-3 rounded-xl bg-[#E67E22] font-bold text-white   hover:bg-amber-600 active:bg-cyan-800    shadow">
        Thanh toán
      </div>
    </>
  );
}
