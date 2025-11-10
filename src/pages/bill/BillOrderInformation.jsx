import { DollarOutlined } from "@ant-design/icons";
import { Card } from "antd";
import React from "react";

export default function BillOrderInformation() {
  return (
    <>
      <Card
        title={
          <>
            <DollarOutlined /> Thông tin đơn hàng
          </>
        }
        style={{ height: "100%" }}
      >
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div type="secondary">Mã đơn hàng:</div>
            <div className="font-bold text-sm">HD_CAsmXAX</div>
          </div>

          <div className="flex justify-between items-center">
            <div type="secondary">Loại đơn:</div>
            <div className="font-semibold text-xs border-2 border-emerald-600  px-2 py-1 rounded-full">
              Tại quầy
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div type="secondary">Trạng thái:</div>
            <div className="font-bold text-xs bg-emerald-600 text-white px-3 py-1 rounded-full flex items-center">
              Chờ giao hàng
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div type="secondary">Phiếu giảm giá:</div>
            <div className="font-bold text-sm">HD_CAsmXAX</div>
          </div>
          <div className="flex justify-between items-center">
            <div type="secondary">Ngày đặt:</div>
            <div className="font-bold text-sm">21:02</div>
          </div>
        </div>
      </Card>
    </>
  );
}
