import React, { useEffect, useState } from "react";
import { Space, Table, Tag } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { fetchPhieuGiamGia } from "../../services/phieuGiamGiaService";
import DiscountForm from "./DiscountForm";

export default function Discount() {
  const { data } = useSelector((state) => state.phieuGiamGia);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
    type: "checkbox",
  };

  useEffect(() => {
    dispatch(fetchPhieuGiamGia());
  }, [dispatch]);

  const columns = [
    {
      title: "STT",
      key: "stt",
      render: (_, __, index) => index + 1,
      width: 60,
      align: "center",
    },
    {
      title: "MÃ GIẢM GIÁ",
      dataIndex: "maGiamGia",
      key: "maGiamGia",
    },
    {
      title: "TÊN CHƯƠNG TRÌNH",
      dataIndex: "tenChuongTrinh",
      key: "tenChuongTrinh",
    },
    {
      title: "KIỂU",
      dataIndex: "kieu",
      key: "kieu",
      render: (value) => (value === 1 ? "Công khai" : "Cá nhân"),
      align: "center",
    },
    {
      title: "GIÁ TRỊ",
      key: "giaTriGiamGia",
      render: (record) =>
        record.loaiGiamGia
          ? `${record.giaTriGiamGia.toLocaleString()} VNĐ`
          : `${record.giaTriGiamGia}%`,
      align: "center",
    },
    {
      title: "NGÀY BẮT ĐẦU",
      dataIndex: "ngayBatDau",
      key: "ngayBatDau",
      render: (date) =>
        new Date(date).toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
      align: "center",
    },
    {
      title: "NGÀY KẾT THÚC",
      dataIndex: "ngayKetThuc",
      key: "ngayKetThuc",
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
            <div className="text-[#00A96C] font-medium">Đang diễn ra</div>
          </Tag>
        ) : (
          <Tag color="red">Đã kết thúc</Tag>
        ),
      align: "center",
    },
    {
      title: "HÀNH ĐỘNG",
      key: "action",
      align: "center",
      render: (_, record) => (
        <Space size="middle">
          <a onClick={() => setEditingItem(record)}>Sửa</a>
        </Space>
      ),
    },
  ];

  return (
    <div className="bg-white min-h-[500px] px-5 py-[32px]">
      <div className="flex justify-between items-center mb-5">
        <p className="text-[#E67E22] font-bold text-[18px] mb-4">
          Danh sách phiếu giảm giá
        </p>
        <button
          onClick={() => navigate("/add-discount")}
          className="border border-[#E67E22] text-[#E67E22] rounded px-10 h-8 cursor-pointer active:bg-[#E67E22] active:text-white"
        >
          Thêm mới
        </button>
      </div>

      <DiscountForm />

      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={data}
        rowKey="id"
        bordered
        pagination={{ pageSize: 5 }}
      />
    </div>
  );
}
