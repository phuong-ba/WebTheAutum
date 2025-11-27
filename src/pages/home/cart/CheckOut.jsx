import React, { useState } from "react";
import logo from "/src/assets/login/logo.png";

import { Col, Form, Input, Pagination, Row, Select, Tooltip } from "antd";
import { NavLink } from "react-router";
import ClientBreadcrumb from "../ClientBreadcrumb";

export default function CheckOut() {
  const [form] = Form.useForm();

  return (
    <>
      <div className="flex flex-col gap-10">
        <div>
          <div className="text-3xl font-bold">Thanh toán</div>
          <ClientBreadcrumb />
        </div>
        <div className="border-dashed border p-4 max-w-[600px]">
          <div className="text-gray-600">
            Khách hàng quay lại? Nhấp vào đây để{" "}
            <NavLink
              to={`/customer/login`}
              className="text-orange-600 hover:underline "
            >
              đăng nhập
            </NavLink>
          </div>
        </div>
        <div className="flex justify-between gap-5">
          <div className="flex-1 flex flex-col gap-5 shadow p-10 basis-[65%]">
            <div className="text-3xl font-bold">Chi tiết thanh toán</div>
            <div>
              <Form form={form} layout="vertical">
                <Row gutter={16} wrap className="gap-10">
                  <Col flex="1">
                    <Form.Item
                      name="HoTen"
                      label="Tên nhân viên"
                      rules={[
                        { required: true, message: "Nhập tên nhân viên" },
                      ]}
                    >
                      <Input placeholder="Nhập tên nhân viên" />
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
                              console.error(
                                "Lỗi kiểm tra số điện thoại:",
                                error
                              );
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

                <Row gutter={16} wrap className="gap-10">
                  <Col flex="1">
                    <Form.Item
                      name="cccd"
                      label="Căn cước công dân"
                      rules={[{ required: true, message: "Nhập CCCD" }]}
                    >
                      <Input placeholder="Nhập căn cước công dân" />
                    </Form.Item>
                  </Col>
                  <Col flex="1">
                    <Form.Item
                      name="Email"
                      label="Email"
                      rules={[
                        { required: true, message: "Nhập Email" },
                        {
                          validator: async (_, value) => {
                            if (!value) return Promise.resolve();

                            try {
                              const res = await axios.get(
                                `http://localhost:8080/api/nhan-vien/check-email`,
                                { params: { email: value } }
                              );

                              const exists = res.data?.data?.exists;

                              if (exists === true) {
                                return Promise.reject(
                                  new Error("Email đã tồn tại trong hệ thống")
                                );
                              }
                              return Promise.resolve();
                            } catch (error) {
                              console.error("Lỗi kiểm tra email:", error);
                              return Promise.reject(
                                new Error(
                                  "Không kiểm tra được email, thử lại sau"
                                )
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input placeholder="Nhập email" />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16} wrap className="gap-10">
                  <Col flex="1">
                    <Form.Item name="province" label="Tỉnh/Thành phố">
                      <Select
                        placeholder="Chọn tỉnh/thành"
                        showSearch
                        optionFilterProp="children"
                      ></Select>
                    </Form.Item>
                  </Col>
                  <Col flex="1">
                    <Form.Item name="ward" label="Phường xã">
                      <Select
                        placeholder="Chọn phường/xã"
                        showSearch
                        optionFilterProp="children"
                      ></Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="DiaChi"
                  label="Số nhà, đường"
                  rules={[{ required: true, message: "Nhập địa chỉ" }]}
                >
                  <Input placeholder="Ví dụ: 123 Nguyễn Trãi" />
                </Form.Item>
              </Form>
            </div>
          </div>
          <div className="flex-1 flex-col flex shadow p-10 gap-3 basis-[35%]">
            <div className="text-3xl font-bold">Đơn hàng của bạn</div>
            <div className="flex justify-between border-b py-4 border-gray-300">
              <div>Sản phẩm</div>
              <div>Tổng</div>
            </div>
            <div className="flex justify-between border-b py-4 border-gray-300">
              <div className="flex gap-1">
                <div>Áo quần 3 màu </div>
                <div>x2</div>
              </div>
              <div>270000đ</div>
            </div>
            <div className="flex justify-between border-b py-4 border-gray-300">
              <div className="flex gap-1">
                <div>Áo quần 3 màu </div>
                <div>x2</div>
              </div>
              <div>270000đ</div>
            </div>
            <div className="flex justify-between border-b py-4 border-gray-300">
              <div className="flex gap-1">
                <div>Áo quần 3 màu </div>
                <div>x2</div>
              </div>
              <div>270000đ</div>
            </div>
            <div className="flex justify-between border-b py-4 border-gray-300">
              <div>Tổng phụ </div>
              <div>270000đ</div>
            </div>
            <div className="flex justify-between items-center border-b py-4 border-gray-300">
              <div>Phí giao hàng</div>
              <div className="flex flex-col gap-3 items-end select-none">
                <label className="flex items-center gap-3 cursor-pointer">
                  <span>
                    Mức giá cố định: <span>20000đ</span>
                  </span>
                  <input
                    type="radio"
                    name="shipping"
                    value="fixed"
                    className="custom-radio"
                  />
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <span>
                    Nhận hàng tại địa phương: <span>25000đ</span>
                  </span>
                  <input
                    type="radio"
                    name="shipping"
                    value="local"
                    className="custom-radio"
                  />
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <span>Miễn phí vận chuyển</span>
                  <input
                    type="radio"
                    name="shipping"
                    value="free"
                    className="custom-radio"
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-between py-4 ">
              <div>Tổng</div>
              <div className="flex gap-2 flex-col">24000000đ</div>
            </div>
            <div className="flex flex-col gap-4 pb-6 select-none">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="bank"
                  className="custom-radio"
                />
                <span>Chuyển khoản ngân hàng trực tiếp</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  className="custom-radio"
                />
                <span>Thanh toán khi nhận hàng</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="paypal"
                  className="custom-radio"
                />
                <span>PayPal</span>
              </label>
            </div>
            <div className="text-center p-4 bg-pink-900 cursor-pointer text-white font-bold hover:bg-black">
              Đặt hàng
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
