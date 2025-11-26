import { Tabs } from "antd";
import React, { useState } from "react";
import ProductList from "./ProductList";

export default function FillterProduct() {
  const [activeKey, setActiveKey] = useState("1");
  return (
    <>
      <div>
        <div className="flex gap-6 justify-between items-center py-10">
          <div className="flex flex-col gap-3">
            <div className="text-amber-500 text-sm font-semibold">
              Tất cả sản phẩm Cửa hàng
            </div>
            <div className="text-3xl font-semibold">Danh sách sản phẩm</div>
          </div>

          <Tabs
            activeKey={activeKey}
            onChange={setActiveKey}
            items={[{ label: "Tất cả sản phẩm", key: "1" }]}
          />
        </div>

        {activeKey === "1" && <ProductList />}
        {activeKey === "2" && <div>Đây là nội dung của Tab 2</div>}
        {activeKey === "3" && <div>Đây là nội dung của Tab 3</div>}
      </div>
    </>
  );
}
