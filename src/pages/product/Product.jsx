import FliterProduct from "./FliterProduct";
import React, { useEffect, useState } from "react";
import { Space, Table, Tag, message, Modal } from "antd";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
export default function Product() {
  const { data } = useSelector((state) => state.nhanvien);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const navigate = useNavigate();
  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
    type: "checkbox", // chọn nhiều
  };
  const columns = [
    {
      title: "STT",
      key: "stt",
      render: (_, __, index) => index + 1,
      width: 60,
      align: "center",
    },
    { title: "TÊN SẢN PHẨM", dataIndex: "maNhanVien", key: "maNhanVien" },
    { title: "HÃNG", dataIndex: "hoTen", key: "hoTen" },
    {
      title: "XUẤT XỨ",
      dataIndex: "gioiTinh",
      key: "gioiTinh",
      render: (value) => (value ? "Nam" : "Nữ"),
      align: "center",
    },
    { title: "CHẤT LIỆU", dataIndex: "sdt", key: "sdt" },
    { title: "KIỂU DÁNG", dataIndex: "diaChi", key: "diaChi" },
    { title: "SỐ LƯỢNG", dataIndex: "chucVuName", key: "chucVuName" },
    { title: "ĐƠN GIÁ", dataIndex: "email", key: "email" },
    {
      title: "NGÀY BẮT ĐẦU",
      dataIndex: "ngayTao",
      key: "ngayTao",
      render: (date) =>
        new Date(date).toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
      align: "center",
    },
    {
      title: "TRẠNG THÁI",
      dataIndex: "trangThai",
      key: "trangThai",
      render: (value) =>
        value ? (
          <Tag color="#E9FBF4">
            <div className="text-[#00A96C] ">Đang hoạt động</div>
          </Tag>
        ) : (
          <Tag color="red">Ngừng hoạt động</Tag>
        ),
      align: "center",
    },
    {
      title: "HÀNH ĐỘNG",
      key: "action",
      align: "center",
      render: (_, record) => (
        <Space size="middle">
          <a onClick={() => setEditingUser(record)}>Sửa</a>
          <a onClick={() => handleDelete(record)}>Xóa</a>
        </Space>
      ),
    },
  ];
  return (
    <>
      <FliterProduct
        editingUser={editingUser}
        onFinishUpdate={() => {
          dispatch(fetchNhanVien());
          setEditingUser(null);
        }}
      />

      <div className="bg-white min-h-[500px] px-5 py-[32px]">
        <div className="flex justify-between items-center mb-5">
          <p className="text-[#E67E22] font-bold text-[18px] mb-4">
            Danh sách nhân viên
          </p>
          <button
            onClick={() => navigate("/add-product")}
            className="border border-[#E67E22] text-[#E67E22] rounded px-10  h-8 cursor-pointer active:bg-[#E67E22] active:text-white"
          >
            Thêm mới
          </button>
        </div>
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={data}
          rowKey="id"
          bordered
          pagination={{ pageSize: 5 }}
        />
      </div>
    </>
  );
}
