import { BtnAdd } from "@/assets/svg/externalIcon";
import { DownOutlined, PlusOutlined } from "@ant-design/icons";
import { Col, Form, Input, Modal, Row, Select, Space } from "antd";
import React, { useState } from "react";
import ProductDetail from "./productDetail/productDetail";
const { Option } = Select;
export default function AddProduct() {
  const [openModal, setOpenModal] = useState(false);
  return (
    <>
      <div className="px-10 py-[20px] bg-white my-10">
        <div className="border-b border-b-amber-400 mb-5 pb-2">
          <p className="font-bold  text-[#E67E22] text-[18px]">
            Thông tin sản phẩm
          </p>
        </div>
        <Form layout="vertical" autoComplete="off">
          <Row gutter={16} wrap>
            <Col flex="1">
              <Form.Item
                name="select-multiple"
                label="Select[multiple]"
                rules={[
                  {
                    required: true,
                    message: "Please select your favourite colors!",
                    type: "array",
                  },
                ]}
              >
                <Select
                  mode="tags"
                  placeholder="Please select favourite colors"
                  style={{ width: "100%" }}
                  dropdownRender={(menu) => menu}
                  suffixIcon={
                    <>
                      <DownOutlined
                        style={{ fontSize: 10, color: "#1C274C" }}
                      />
                      <PlusOutlined
                        className="border rounded-full p-1"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setOpenModal(true);
                        }}
                        style={{
                          fontSize: 10,
                          color: "#1C274C",
                          cursor: "pointer",
                        }}
                      />
                    </>
                  }
                >
                  <Option value="red">Red</Option>
                  <Option value="green">Green</Option>
                  <Option value="blue">Blue</Option>
                </Select>
              </Form.Item>
              <Modal title="Thêm mới màu sắc" footer={null}>
                {/* Nội dung modal */}
                <p>Form thêm mới ở đây...</p>
              </Modal>
            </Col>

            <Col flex="1">
              <Form.Item
                name="select-multiple"
                label="Select[multiple]"
                rules={[
                  {
                    required: true,
                    message: "Please select your favourite colors!",
                    type: "array",
                  },
                ]}
              >
                <Select
                  mode="tags"
                  placeholder="Please select favourite colors"
                  style={{ width: "100%" }}
                  dropdownRender={(menu) => menu}
                  suffixIcon={
                    <>
                      <DownOutlined
                        style={{ fontSize: 10, color: "#1C274C" }}
                      />
                      <PlusOutlined
                        className="border rounded-full p-1"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setOpenModal(true);
                        }}
                        style={{
                          fontSize: 10,
                          color: "#1C274C",
                          cursor: "pointer",
                        }}
                      />
                    </>
                  }
                >
                  <Option value="red">Red</Option>
                  <Option value="green">Green</Option>
                  <Option value="blue">Blue</Option>
                </Select>
              </Form.Item>
              <Modal title="Thêm mới màu sắc" footer={null}>
                {/* Nội dung modal */}
                <p>Form thêm mới ở đây...</p>
              </Modal>
            </Col>
            <Col flex="1">
              <Form.Item
                name="select-multiple"
                label="Select[multiple]"
                rules={[
                  {
                    required: true,
                    message: "Please select your favourite colors!",
                    type: "array",
                  },
                ]}
              >
                <Select
                  mode="tags"
                  placeholder="Please select favourite colors"
                  style={{ width: "100%" }}
                  dropdownRender={(menu) => menu}
                  suffixIcon={
                    <>
                      <DownOutlined
                        style={{ fontSize: 10, color: "#1C274C" }}
                      />
                      <PlusOutlined
                        className="border rounded-full p-1"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setOpenModal(true);
                        }}
                        style={{
                          fontSize: 10,
                          color: "#1C274C",
                          cursor: "pointer",
                        }}
                      />
                    </>
                  }
                >
                  <Option value="red">Red</Option>
                  <Option value="green">Green</Option>
                  <Option value="blue">Blue</Option>
                </Select>
              </Form.Item>
              <Modal title="Thêm mới màu sắc" footer={null}>
                {/* Nội dung modal */}
                <p>Form thêm mới ở đây...</p>
              </Modal>
            </Col>
            <Col flex="1">
              <Form.Item
                name="select-multiple"
                label="Select[multiple]"
                rules={[
                  {
                    required: true,
                    message: "Please select your favourite colors!",
                    type: "array",
                  },
                ]}
              >
                <Select
                  mode="tags"
                  placeholder="Please select favourite colors"
                  style={{ width: "100%" }}
                  dropdownRender={(menu) => menu}
                  suffixIcon={
                    <>
                      <DownOutlined
                        style={{ fontSize: 10, color: "#1C274C" }}
                      />
                      <PlusOutlined
                        className="border rounded-full p-1"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setOpenModal(true);
                        }}
                        style={{
                          fontSize: 10,
                          color: "#1C274C",
                          cursor: "pointer",
                        }}
                      />
                    </>
                  }
                >
                  <Option value="red">Red</Option>
                  <Option value="green">Green</Option>
                  <Option value="blue">Blue</Option>
                </Select>
              </Form.Item>
              <Modal title="Thêm mới màu sắc" footer={null}>
                {/* Nội dung modal */}
                <p>Form thêm mới ở đây...</p>
              </Modal>
            </Col>
            <Col flex="1">
              <Form.Item
                name="select-multiple"
                label="Select[multiple]"
                rules={[
                  {
                    required: true,
                    message: "Please select your favourite colors!",
                    type: "array",
                  },
                ]}
              >
                <Select
                  mode="tags"
                  placeholder="Please select favourite colors"
                  style={{ width: "100%" }}
                  dropdownRender={(menu) => menu}
                  suffixIcon={
                    <>
                      <DownOutlined
                        style={{ fontSize: 10, color: "#1C274C" }}
                      />
                      <PlusOutlined
                        className="border rounded-full p-1"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setOpenModal(true);
                        }}
                        style={{
                          fontSize: 10,
                          color: "#1C274C",
                          cursor: "pointer",
                        }}
                      />
                    </>
                  }
                >
                  <Option value="red">Red</Option>
                  <Option value="green">Green</Option>
                  <Option value="blue">Blue</Option>
                </Select>
              </Form.Item>
              <Modal title="Thêm mới màu sắc" footer={null}>
                {/* Nội dung modal */}
                <p>Form thêm mới ở đây...</p>
              </Modal>
            </Col>
          </Row>
        </Form>
      </div>

      <div className="px-10 py-[20px] bg-white my-10">
        <div className="border-b border-b-amber-400 mb-5 pb-2">
          <p className="font-bold text-md">Thông tin sản phẩm</p>
        </div>
        <Form layout="vertical" autoComplete="off">
          <Row gutter={16} wrap>
            <Col flex="1">
              <Form.Item
                name="select-multiple"
                label="Select[multiple]"
                rules={[
                  {
                    required: true,
                    message: "Please select your favourite colors!",
                    type: "array",
                  },
                ]}
              >
                <Select
                  mode="tags"
                  placeholder="Please select favourite colors"
                  style={{ width: "100%" }}
                  dropdownRender={(menu) => menu}
                  suffixIcon={
                    <>
                      <DownOutlined
                        style={{ fontSize: 10, color: "#1C274C" }}
                      />
                      <PlusOutlined
                        className="border rounded-full p-1"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setOpenModal(true);
                        }}
                        style={{
                          fontSize: 10,
                          color: "#1C274C",
                          cursor: "pointer",
                        }}
                      />
                    </>
                  }
                >
                  <Option value="red">Red</Option>
                  <Option value="green">Green</Option>
                  <Option value="blue">Blue</Option>
                </Select>
              </Form.Item>
              <Modal title="Thêm mới màu sắc" footer={null}>
                {/* Nội dung modal */}
                <p>Form thêm mới ở đây...</p>
              </Modal>
            </Col>

            <Col flex="1">
              <Form.Item
                name="select-multiple"
                label="Select[multiple]"
                rules={[
                  {
                    required: true,
                    message: "Please select your favourite colors!",
                    type: "array",
                  },
                ]}
              >
                <Select
                  mode="tags"
                  placeholder="Please select favourite colors"
                  style={{ width: "100%" }}
                  dropdownRender={(menu) => menu}
                  suffixIcon={
                    <>
                      <DownOutlined
                        style={{ fontSize: 10, color: "#1C274C" }}
                      />
                      <PlusOutlined
                        className="border rounded-full p-1"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setOpenModal(true);
                        }}
                        style={{
                          fontSize: 10,
                          color: "#1C274C",
                          cursor: "pointer",
                        }}
                      />
                    </>
                  }
                >
                  <Option value="red">Red</Option>
                  <Option value="green">Green</Option>
                  <Option value="blue">Blue</Option>
                </Select>
              </Form.Item>
              <Modal title="Thêm mới màu sắc" footer={null}>
                {/* Nội dung modal */}
                <p>Form thêm mới ở đây...</p>
              </Modal>
            </Col>
            <Col flex="1">
              <Form.Item
                name="select-multiple"
                label="Select[multiple]"
                rules={[
                  {
                    required: true,
                    message: "Please select your favourite colors!",
                    type: "array",
                  },
                ]}
              >
                <Select
                  mode="tags"
                  placeholder="Please select favourite colors"
                  style={{ width: "100%" }}
                  dropdownRender={(menu) => menu}
                  suffixIcon={
                    <>
                      <DownOutlined
                        style={{ fontSize: 10, color: "#1C274C" }}
                      />
                      <PlusOutlined
                        className="border rounded-full p-1"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setOpenModal(true);
                        }}
                        style={{
                          fontSize: 10,
                          color: "#1C274C",
                          cursor: "pointer",
                        }}
                      />
                    </>
                  }
                >
                  <Option value="red">Red</Option>
                  <Option value="green">Green</Option>
                  <Option value="blue">Blue</Option>
                </Select>
              </Form.Item>
              <Modal title="Thêm mới màu sắc" footer={null}>
                {/* Nội dung modal */}
                <p>Form thêm mới ở đây...</p>
              </Modal>
            </Col>
            <Col flex="1">
              <Form.Item
                name="select-multiple"
                label="Select[multiple]"
                rules={[
                  {
                    required: true,
                    message: "Please select your favourite colors!",
                    type: "array",
                  },
                ]}
              >
                <Select
                  mode="tags"
                  placeholder="Please select favourite colors"
                  style={{ width: "100%" }}
                  dropdownRender={(menu) => menu}
                  suffixIcon={
                    <>
                      <DownOutlined
                        style={{ fontSize: 10, color: "#1C274C" }}
                      />
                      <PlusOutlined
                        className="border rounded-full p-1"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setOpenModal(true);
                        }}
                        style={{
                          fontSize: 10,
                          color: "#1C274C",
                          cursor: "pointer",
                        }}
                      />
                    </>
                  }
                >
                  <Option value="red">Red</Option>
                  <Option value="green">Green</Option>
                  <Option value="blue">Blue</Option>
                </Select>
              </Form.Item>
              <Modal title="Thêm mới màu sắc">
                {/* Nội dung modal */}
                <p>Form thêm mới ở đây...</p>
              </Modal>
            </Col>
            <Col flex="1">
              <Form.Item
                name="select-multiple"
                label="Select[multiple]"
                rules={[
                  {
                    required: true,
                    message: "Please select your favourite colors!",
                    type: "array",
                  },
                ]}
              >
                <Select
                  mode="tags"
                  placeholder="Please select favourite colors"
                  style={{ width: "100%" }}
                  dropdownRender={(menu) => menu}
                  suffixIcon={
                    <>
                      <DownOutlined
                        style={{ fontSize: 10, color: "#1C274C" }}
                      />
                      <PlusOutlined
                        className="border rounded-full p-1"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setOpenModal(true);
                        }}
                        style={{
                          fontSize: 10,
                          color: "#1C274C",
                          cursor: "pointer",
                        }}
                      />
                    </>
                  }
                >
                  <Option value="red">Red</Option>
                  <Option value="green">Green</Option>
                  <Option value="blue">Blue</Option>
                </Select>
              </Form.Item>
              <Modal
                open={openModal}
                onCancel={() => setOpenModal(false)}
                footer={null}
              >
                <div>
                  <div>
                    <p>Thêm mới hãng</p>
                    <Row gutter={16} wrap>
                      <Col flex="1">
                        <Form.Item name="diaChi" label="Địa chỉ">
                          <Input placeholder="Nhập địa chỉ" />
                        </Form.Item>
                      </Col>

                      <Col flex="1">
                        <Form.Item name="email" label="Email">
                          <Input placeholder="Nhập email" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <div className="flex flex-col items-center  pr-3 gap-4">
                      <div className="flex gap-4">
                        <button className="border border-[#E67E22] font-[Roboto] text-[#E67E22] rounded px-6 h-8 cursor-pointer active:bg-[#E67E22] active:text-white">
                          Nhập lại
                        </button>
                        <button
                          className=" bg-[#E67E22]  font-[Roboto] text-white rounded px-6  cursor-pointer h-8 active:bg-[#0821ad] active:text-white"
                          type="submit"
                        >
                          Tạo biến thể
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Modal>
            </Col>
          </Row>
        </Form>
      </div>
      <div className="flex flex-col items-end  pr-3 gap-4">
        <div className="flex gap-4">
          <button className="border border-[#E67E22] font-[Roboto] text-[#E67E22] rounded px-6 h-8 cursor-pointer active:bg-[#E67E22] active:text-white">
            Nhập lại
          </button>
          <button
            className=" bg-[#E67E22]  font-[Roboto] text-white rounded px-6  cursor-pointer h-8 active:bg-[#0821ad] active:text-white"
            type="submit"
          >
            Tạo biến thể
          </button>
        </div>
        <div className="w-[227px]">
          <Input />
        </div>
      </div>
      <ProductDetail />
    </>
  );
}
