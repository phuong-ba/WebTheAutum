import React from "react";

export default function Advise() {
  return (
    <>
      <div className="flex justify-between bg-cyan-50 border-2 border-gray-200 px-6 py-10 items-center rounded-tl-4xl rounded-br-4xl">
        <div className="flex flex-col gap-10">
          <div className="font-bold text-3xl">Bạn cần gì từ chúng tôi</div>
          <div className="max-w-[480px] font-base">
            Chúng tôi không chỉ bán sản phẩm – chúng tôi giúp bạn chọn lựa điều
            tốt nhất cho nhu cầu của bạn.
          </div>
        </div>
        <div className=" px-8 py-4 bg-amber-700 rounded-2xl font-semibold text-white cursor-pointer shadow overflow-hidden hover:bg-amber-500 active:bg-blue-900 transition select-none">
          Liên hệ
        </div>
      </div>
    </>
  );
}
