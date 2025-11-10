import { ClockCountdownIcon } from "@phosphor-icons/react";
import React from "react";

export default function BillInvoiceHistory() {
  return (
    <>
      <div className="bg-white flex flex-col  rounded-lg shadow overflow-hidden my-5">
        <div>
          <div className="flex justify-between items-center py-3 px-6 bg-gray-200">
            <div className="text-sm font-semibold flex gap-2 items-center">
              <ClockCountdownIcon size={20} />
              Lịch sử hóa đơn
            </div>
          </div>
        </div>
        <div className="px-3 py-3">
          <div className="border-l-2 rounded-lg border-amber-600 px-3 flex flex-col gap-2">
            <div className="font-semibold">Thanh toán hóa đơn</div>
            <div className="flex justify-between">
              <div className="text-gray-500 text-sm font-semibold">NV00001</div>
              <div className="text-gray-500 text-sm font-semibold">21:42</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
