import React, { useEffect, useState } from "react";
import { Table, Input } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllKhachHang } from "@/services/khachHangService";

export default function TableKhachHang({ onSelectChange, selectedRowKeys }) {
  const { data } = useSelector((state) => state.khachHang);
  const dispatch = useDispatch();
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchAllKhachHang());
  }, [dispatch]);

  const filteredData =
    search.trim() === ""
      ? data
      : data?.filter((item) =>
          item.hoTen.toLowerCase().includes(search.toLowerCase())
        );

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
    type: "checkbox",
  };

  const columns = [
    { title: "STT", key: "stt", render: (_, __, index) => index + 1 },
    { title: "Tên khách hàng", dataIndex: "hoTen", key: "hoTen" },
    { title: "Số điện thoại", dataIndex: "sdt", key: "sdt" },
    {
      title: "Giới tính",
      dataIndex: "gioiTinh",
      key: "gioiTinh",
      render: (v) => (v ? "Nam" : "Nữ"),
    },
    { title: "Email", dataIndex: "email", key: "email" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="font-bold text-lg text-[#E67E22]">Danh sách khách hàng</p>
      </div>
      <div className="max-w-[400px]">
        <label className="block mb-1">Tìm kiếm khách hàng</label>
        <Input
          placeholder="Nhập tên khách hàng"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <Table
        rowSelection={{
          preserveSelectedRowKeys: true,
          ...rowSelection,
        }}
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        bordered
        pagination={{ pageSize: 5 }}
      />
    </div>
  );
}
