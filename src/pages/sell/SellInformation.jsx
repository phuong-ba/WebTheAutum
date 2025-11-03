import {
  InfoIcon,
  TagIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";
import { Checkbox, Col, Form, Input, Row } from "antd";
import Search from "antd/es/input/Search";
import { TrashIcon } from "lucide-react";
import React from "react";
import { Tabs } from "antd";
import SellPay from "./SellPay";

export default function SellInformation() {
  const onSearch = (value, _e, info) => console.log(info?.source, value);
  const a = true;
  const onChange = (key) => {
    console.log(key);
  };
  const items = [
    {
      key: "1",
      label: "Mã tốt nhất",
      children: (
        <>
          <div className="flex flex-col gap-4">
            <div className="relative p-4 border-2 border-gray-300 rounded-xl flex flex-col items-start gap-3">
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
                  <span className="text-lg font-semibold">-20000000vnd</span>
                </div>
                <div className="text-md">Hết hạn: 17/5/2001</div>
                <div className="text-md">Đơn tối thiểu: 900.000 VND</div>
              </div>
            </div>
            <SellPay />
          </div>
        </>
      ),
    },
    {
      key: "2",
      label: "Mã thay thế",
      children: (
        <>
          <div className="flex flex-col gap-2">
            <div className="relative p-4 border-2 border-gray-300 rounded-xl flex flex-col items-start gap-3">
              <div className="bg-amber-700 text-white font-semibold px-5 py-1 rounded-md">
                PGGGGASDASC_ÁACC
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1 items-center">
                    <TagIcon size={24} weight="fill" />
                    <span className="font-semibold text-xl">Giảm:</span>
                  </div>
                  <span className="text-lg font-semibold">-20000000vnd</span>
                </div>
                <div className="text-md">Hết hạn: 17/5/2001</div>
                <div className="text-md">Đơn tối thiểu: 900.000 VND</div>
              </div>
            </div>
            <div className="relative p-4 border-2 border-gray-300 rounded-xl flex flex-col items-start gap-3">
              <div className="bg-amber-700 text-white font-semibold px-5 py-1 rounded-md">
                PGGGGASDASC_ÁACC
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1 items-center">
                    <TagIcon size={24} weight="fill" />
                    <span className="font-semibold text-xl">Giảm:</span>
                  </div>
                  <span className="text-lg font-semibold">-20000000vnd</span>
                </div>
                <div className="text-md">Hết hạn: 17/5/2001</div>
                <div className="text-md">Đơn tối thiểu: 900.000 VND</div>
              </div>
            </div>
          </div>
        </>
      ),
    },
  ];
  return (
    <>
      <div className="shadow overflow-hidden bg-white rounded-lg h-full">
        <div className=" p-3 font-bold text-xl bg-gray-200 rounded-t-lg flex gap-2 justify-between">
          <div className="flex gap-2 items-center">
            <InfoIcon size={24} />
            Thông tin đơn
          </div>
          <div>
            {a ? (
              <div className="flex items-center gap-2">
                <ToggleRightIcon weight="fill" size={30} color="#00A96C" />
                <span className="text-sm font-semibold text-gray-600">
                  Bán giao hàng
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <ToggleLeftIcon weight="fill" size={30} color="#c5c5c5" />
                <span className="text-sm font-semibold text-gray-600">
                  Bán giao hàng
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="p-4 flex flex-col gap-4">
          <div className="font-semibold text-2xl">Thông tin người nhận</div>
          <div className="p-4 border border-gray-300 rounded-xl">
            <Form layout="vertical">
              <Row gutter={16} wrap>
                <Col flex="1">
                  <Form.Item
                    name="HoTen"
                    label="Tên Khách hàng"
                    rules={[{ required: true, message: "Nhập tên Khách hàng" }]}
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
                      {
                        validator: async (_, value) => {
                          if (!value) return Promise.resolve();

                          try {
                            const res = await axios.get(
                              `http://localhost:8080/api/nhan-vien/check-sdt`,
                              { params: { sdt: value } }
                            );

                            const exists = res.data?.data?.exists;

                            if (exists === true) {
                              return Promise.reject(
                                new Error(
                                  "Số điện thoại đã tồn tại trong hệ thống"
                                )
                              );
                            }

                            return Promise.resolve();
                          } catch (error) {
                            console.error("Lỗi kiểm tra số điện thoại:", error);
                            return Promise.reject(
                              new Error(
                                "Không kiểm tra được số điện thoại, thử lại sau"
                              )
                            );
                          }
                        },
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
        <div className="p-4 flex flex-col gap-4">
          <div className="font-semibold text-2xl">Mã giảm giá</div>
          <Tabs defaultActiveKey="1" items={items} onChange={onChange} />
        </div>
      </div>
    </>
  );
}
