import React, { useEffect, useState } from "react";
import { Space, Table, Tag } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { fetchPhieuGiamGia } from "../../services/phieuGiamGiaService";
import Input from "antd/es/input/Input";

export default function TableDiscount() {
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
  ];
  return (
    <>
      <div className="flex flex-col gap-5 border-t border-dashed border-slate-400 py-5 px-10">
        <div className="max-w-[400px]">
          <Input placeholder="Tìm kiếm" />
        </div>
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={data}
          rowKey="id"
          bordered
          pagination={false}
        />
      </div>
    </>
  );
}
