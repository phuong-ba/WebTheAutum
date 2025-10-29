import React, { useEffect, useState } from "react";
import { Table, Input } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { fetchSanPham } from "@/services/sanPhamService";

export default function TableSanPham({ selectedRowKeys, onSelectChange }) {
  const { data } = useSelector((state) => state.sanPham);
  const dispatch = useDispatch();
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ current: 1, pageSize: 5 });

  useEffect(() => {
    dispatch(fetchSanPham());
  }, [dispatch]);

  const filteredData = data
    ?.filter((item) => item.trangThai === true)
    ?.filter((item) =>
      search.trim() === ""
        ? true
        : item.tenSanPham?.toLowerCase().includes(search.toLowerCase())
    );

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
    type: "checkbox",
  };

  const columns = [
    {
      title: "STT",
      key: "stt",
      render: (_, __, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    { title: "Mã sản phẩm", dataIndex: "maSanPham", key: "maSanPham" },
    { title: "Tên sản phẩm", dataIndex: "tenSanPham", key: "tenSanPham" },
    { title: "Xuất xứ", dataIndex: "tenXuatXu", key: "tenXuatXu" },
    { title: "Số lượng", dataIndex: "tongSoLuong", key: "tongSoLuong" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="font-bold text-lg text-[#E67E22]">Danh sách sản phẩm</p>
      </div>
      <div className="max-w-[400px]">
        <label className="block mb-1">Tìm kiếm sản phẩm</label>
        <Input
          placeholder="Nhập tên sản phẩm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <Table
        rowSelection={{ preserveSelectedRowKeys: true, ...rowSelection }}
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        bordered
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          onChange: (page, pageSize) =>
            setPagination({ current: page, pageSize }),
        }}
      />
    </div>
  );
}
