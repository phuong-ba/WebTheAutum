import React from "react";

export default function Advise() {
  return (
    <>
      <div className="flex justify-between bg-cyan-100 px-6 py-10 items-center rounded-tl-4xl rounded-br-4xl">
        <div className="flex flex-col gap-10">
          <div className="font-bold text-3xl">Bạn cần gì từ chúng tôi</div>
          <div>
            Chúng tôi không chỉ bán sản phẩm – chúng tôi giúp bạn chọn lựa điều
            tốt nhất cho nhu cầu của bạn.
          </div>
        </div>
        <div className="border px-8 py-4 bg-amber-200 rounded-2xl">Liên hệ</div>
      </div>
    </>
  );
}
