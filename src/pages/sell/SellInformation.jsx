import React, { useState } from "react";
import {
  InfoIcon,
  TagIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";
import { Checkbox, Col, Form, Input, Row, Tabs } from "antd";
import Search from "antd/es/input/Search";
import { TrashIcon } from "lucide-react";
import SellPay from "./SellPay";

export default function SellInformation() {
  const onSearch = (value, _e, info) => console.log(info?.source, value);

  // ✅ Dùng useState để bật/tắt
  const [isDelivery, setIsDelivery] = useState(false);

  const onChange = (key) => {
    console.log(key);
  };

  const handleToggleDelivery = () => {
    setIsDelivery((prev) => !prev);
  };
  const replacementCodes = [
    {
      id: 1,
      code: "KM_TET2025222",
      discount: "-20000000 VND",
      expire: "17/05/2001",
      minOrder: "900.000 VND",
    },
    {
      id: 2,
      code: "KM_TET2025",
      discount: "-1000000 VND",
      expire: "01/02/2025",
      minOrder: "500.000 VND",
    },
  ];
  const items = [
    {
      key: "1",
      label: "Mã tốt nhất",
      children: (
        <div className="flex flex-col gap-4">
          <div className="relative p-4 border-2 border-gray-300 rounded-xl flex flex-col items-start gap-3 bg-amber-50">
            <div className="absolute font-semibold bg-amber-700 right-0 top-0 rounded-tr-xl rounded-bl-xl py-1 px-4 text-white">
              Mã tốt nhất
            </div>
            <div className="bg-amber-700 text-white font-semibold px-5 py-1 rounded-md">
              PGGGGASDASC_ÁACC
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className="flex gap-1 items-center">
                  <TagIcon size={24} weight="fill" />
                  <span className="font-semibold text-xl">Giảm:</span>
                </div>
                <span className="text-lg font-semibold text-red-800">-20000000vnd</span>
              </div>
              <div className="text-md font-semibold text-gray-700">Hết hạn: 17/5/2001</div>
              <div className="text-md font-semibold text-gray-700">Đơn tối thiểu: 900.000 VND</div>
            </div>
          </div>
          <SellPay />
        </div>
      ),
    },
    {
      key: "2",
      label: "Mã thay thế",
      children: (
        <div className="flex flex-col gap-2">
          {replacementCodes.map((item) => (
            <div
              key={item.id}
              className="relative p-4 border-2 border-gray-300 rounded-xl flex flex-col items-start gap-3 bg-amber-50"
            >
              <div className="bg-amber-700 text-white font-semibold px-5 py-1 rounded-md">
                {item.code}
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1 items-center">
                    <TagIcon size={24} weight="fill" />
                    <span className="font-semibold text-xl">Giảm:</span>
                  </div>
                  <span className="text-lg font-semibold text-red-800">{item.discount}</span>
                </div>
                <div className="text-md font-semibold text-gray-700">Hết hạn: {item.expire}</div>
                <div className="text-md font-semibold text-gray-700">Đơn tối thiểu: {item.minOrder}</div>
              </div>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="shadow overflow-hidden bg-white rounded-lg h-full">
        {/* Header */}
        <div className="p-3 font-bold text-xl bg-gray-200 rounded-t-lg flex gap-2 justify-between">
          <div className="flex gap-2 items-center">
            <InfoIcon size={24} />
            Thông tin đơn
          </div>

          
          <div
            className="flex items-center gap-2 cursor-pointer select-none"
            onClick={handleToggleDelivery}
          >
            {isDelivery ? (
              <>
                <ToggleRightIcon weight="fill" size={30} color="#00A96C" />
                <span className="text-sm font-semibold text-gray-600">
                  Bán giao hàng
                </span>
              </>
            ) : (
              <>
                <ToggleLeftIcon weight="fill" size={30} color="#c5c5c5" />
                <span className="text-sm font-semibold text-gray-600">
                  Bán giao hàng
                </span>
              </>
            )}
          </div>
        </div>

        {isDelivery && (
          <div className="p-4 flex flex-col gap-4">
            <div className="font-semibold text-2xl">Thông tin người nhận</div>
            <div className="p-4 border border-gray-300 rounded-xl">
              <Form layout="vertical">
                <Row gutter={16} wrap>
                  <Col flex="1">
                    <Form.Item
                      name="HoTen"
                      label="Tên Khách hàng"
                      rules={[
                        { required: true, message: "Nhập tên Khách hàng" },
                      ]}
                    >
                      <Input placeholder="Nhập tên Khách hàng" />
                    </Form.Item>
                  </Col>
                  <Col flex="1">
                    <Form.Item
                      name="SoDienThoai"
                      label="Số điện thoại"
                      rules={[
                        { required: true, message: "Nhập số điện thoại" },
                        {
                          pattern: /^0\d{9}$/,
                          message:
                            "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0",
                        },
                      ]}
                    >
                      <Input placeholder="Nhập số điện thoại" />
                    </Form.Item>
                  </Col>
                </Row>

                <div className="flex justify-between">
                  <span>Giao hàng tận nhà</span>
                  <Checkbox />
                </div>
              </Form>
            </div>
          </div>
        )}

        <div className="p-4 flex flex-col gap-4">
          <div className="font-semibold text-2xl">Mã giảm giá</div>
          <Tabs
            defaultActiveKey="1"
            items={items}
            onChange={onChange}
            className="custom-tabs"
          />
        </div>
      </div>
    </>
  );
}
