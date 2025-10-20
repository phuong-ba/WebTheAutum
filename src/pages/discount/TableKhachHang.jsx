import React, { useEffect, useState } from "react";
import { Table, Input } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllKhachHang } from "@/services/khachHangService";
import dayjs from "dayjs";

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

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
  });

  const columns = [
    {
      title: "STT",
      key: "stt",
      render: (_, __, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    { title: "Tên khách hàng", dataIndex: "hoTen", key: "hoTen" },
    { title: "Số điện thoại", dataIndex: "sdt", key: "sdt" },
    {
      title: "Giới tính",
      dataIndex: "gioiTinh",
      key: "gioiTinh",
      render: (v) => (v ? "Nam" : "Nữ"),
    },
    {
      title: "Ngày sinh",
      dataIndex: "ngaySinh",
      key: "ngaySinh",
      render: (value) => (value ? dayjs(value).format("DD/MM/YYYY") : ""),
    },
    { title: "Email", dataIndex: "email", key: "email" },
    {
      title: "Số lần mua hàng",
      dataIndex: "soLanMua",
      key: "soLanMua",
    },
    {
      title: "Ngày mua gần nhất",
      dataIndex: "ngayMuaGanNhat",
      key: "ngayMuaGanNhat",
      render: (d) => (d ? dayjs(d).format("DD/MM/YYYY") : "Chưa có"),
    },
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
