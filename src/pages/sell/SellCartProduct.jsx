import { ReceiptXIcon } from "@phosphor-icons/react";
import { Col, Form, Input, Row, Select } from "antd";
import Search from "antd/es/input/Search";
import { TrashIcon } from "lucide-react";
import React from "react";

export default function SellCartProduct() {
  const onSearch = (value, _e, info) => console.log(info?.source, value);
  const imageUrl = "";

  // Giả lập dữ liệu giỏ hàng — thay bằng state thực tế của bạn
  const cartProducts = []; // hoặc [{ id: 1, name: "Áo thun", ... }]

  const handleDeleteBill = (id) => {
    console.log("Xóa sản phẩm:", id);
  };

  return (
    <>
      <div className="shadow overflow-hidden rounded-lg min-h-[160px] bg-white">
        <div className="p-4 font-bold text-2xl bg-amber-600 opacity-75 rounded-t-lg text-white">
          Sản phẩm trong giỏ hàng
        </div>

        <div className="">
          <div className="flex items-center justify-between gap-2 p-4 border-b border-gray-300">
            <div className="flex justify-between gap-3">
              <Search placeholder="Tìm kiếm hóa đơn..." onSearch={onSearch} />
              <Select
                options={[{ label: "Demo", value: "demo" }]}
                className="min-w-[200px]"
              />
              <Select
                options={[{ label: "Demo", value: "demo" }]}
                className="min-w-[200px]"
              />
              <Select
                options={[{ label: "Demo", value: "demo" }]}
                className="min-w-[200px]"
              />
            </div>

            <div className="font-bold text-sm py-2 px-4 min-w-[120px] cursor-pointer select-none text-center rounded-md bg-[#E67E22] text-white hover:bg-amber-600 active:bg-cyan-800 shadow">
              Quét QR
            </div>
          </div>

          {cartProducts.length === 0 ? (
            <div className="flex flex-col gap-3 items-center justify-center p-8 text-gray-500">
              <div className="p-4 rounded-full bg-amber-600">
                <ReceiptXIcon size={48} className="text-white" />
              </div>
              <div className="text-lg font-semibold">
                Chưa có sản phẩm nào trong giỏ hàng
              </div>
            </div>
          ) : (
            <div className="flex flex-col shadow overflow-hidden gap-4 p-4">
              {cartProducts.map((bill, index) => (
                <div
                  key={bill.id}
                  className="flex justify-between items-center border-4 border-cyan-700 px-8 py-3 rounded-tl-4xl rounded-br-4xl"
                >
                  <div className="flex-2 flex items-center gap-20">
                    <div className="font-bold">{index + 1}</div>
                    <div className="max-w-[120px] max-h-[160px] object-cover rounded-xl flex items-center justify-center overflow-hidden">
                      {bill.imageUrl ? (
                        <img
                          src={bill.imageUrl}
                          alt={bill.name}
                          className="rounded-xl w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full border-2 min-w-[120px] min-h-[160px] border-dashed border-gray-400 rounded-xl flex items-center justify-center text-gray-400 text-sm">
                          Không có ảnh
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="font-bold text-2xl">{bill.name}</div>
                      <div className="flex gap-2">
                        <div className="text-xs bg-amber-600 text-white rounded px-4 font-semibold">
                          {bill.color}
                        </div>
                        <div className="text-xs bg-amber-600 text-white rounded px-4 font-semibold">
                          {bill.size}
                        </div>
                      </div>
                      <div className="flex gap-1 items-center">
                        <div>IMEI:</div>
                        <div className="border rounded border-amber-600 px-3 py-1 text-sm cursor-pointer">
                          Xem IMEI
                        </div>
                      </div>
                      <div>
                        Số lượng:{" "}
                        <span className="font-bold">{bill.quantity}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-4">
                    <div className="flex flex-col items-end gap-1">
                      <div className="text-red-600 opacity-80 font-bold text-lg">
                        {bill.totalPrice} VND
                      </div>
                      <div className="text-gray-400 font-semibold text-sm">
                        Đơn giá: <span>{bill.unitPrice} VND</span>
                      </div>
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
          )}
        </div>
      </div>
    </>
  );
}
