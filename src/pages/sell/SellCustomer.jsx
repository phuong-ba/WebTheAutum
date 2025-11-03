import { UsersThreeIcon } from "@phosphor-icons/react";
import { Col, Form, Input, Row } from "antd";
import Search from "antd/es/input/Search";
import { TrashIcon } from "lucide-react";
import React from "react";

export default function SellCustomer() {
  const onSearch = (value, _e, info) => console.log(info?.source, value);

  return (
    <>
      <div className="shadow overflow-hidden bg-white rounded-lg h-full">
        <div className=" p-3 font-bold text-xl bg-gray-200 rounded-t-lg flex gap-2 items-center">
          <UsersThreeIcon size={24} />
          Khách hàng
        </div>
        <div className="gap-5 py-4 px-5 flex flex-col ">
          <Search
            placeholder="Tìm kiếm khách hàng, sđt..."
            onSearch={onSearch}
          />
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
          </Form>
          <div className="cursor-pointer select-none  text-center py-3 rounded-xl bg-[#E67E22] font-bold text-white   hover:bg-amber-600 active:bg-cyan-800    shadow">
            Thêm khách hàng
          </div>
        </div>
      </div>
    </>
  );
}
