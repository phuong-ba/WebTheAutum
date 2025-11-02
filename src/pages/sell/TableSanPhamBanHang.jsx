// pages/sell/TableSanPhamBanHang.js
import React, { useEffect, useState } from "react";
import { Table, Input, Button } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { PlusOutlined } from "@ant-design/icons";
import { fetchChiTietSanPham } from "@/services/chiTietSanPhamService";

export default function TableSanPhamBanHang({ onAddProduct }) {
  const { data, loading } = useSelector((state) => state.chiTietSanPham);
  const dispatch = useDispatch();
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
  });

  useEffect(() => {
    dispatch(fetchChiTietSanPham());
  }, [dispatch]);

  const filteredData = data
    ?.filter((item) => item.trangThai === true)
    ?.filter((item) =>
      search.trim() === ""
        ? true
        : item.tenSanPham?.toLowerCase().includes(search.toLowerCase())
    );

  const columns = [
    {
      title: "STT",
      key: "stt",
      render: (_, __, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: "Ảnh",
      dataIndex: "anhs",
      key: "anhs",
      render: (anhs) =>
        anhs && anhs.length > 0 ? (
          <img
            src={anhs[0].duongDanAnh}
            alt="Sản phẩm"
            style={{
              width: 50,
              height: 50,
              objectFit: "cover",
              borderRadius: 4,
            }}
          />
        ) : (
          <div
            style={{
              width: 50,
              height: 50,
              backgroundColor: "#f0f0f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 4,
              color: "#999",
              fontSize: 12,
            }}
          >
            Chưa có ảnh
          </div>
        ),
    },
    {
      title: "Mã vạch",
      dataIndex: "maVach",
      key: "maVach",
    },
    {
      title: "Tên sản phẩm",
      dataIndex: "tenSanPham",
      render: (val) => val || "-",
    },
    {
      title: "Màu sắc",
      dataIndex: "tenMauSac",
      render: (val) => val || "-",
    },
    {
      title: "Kích thước",
      dataIndex: "tenKichThuoc",
      render: (val) => val || "-",
    },
    {
      title: "Số lượng tồn",
      dataIndex: "soLuongTon",
      key: "soLuongTon",
    },
    {
      title: "Giá bán",
      key: "giaBan",
      render: (record) => {
        const dotGiamGia = record.dotGiamGiaChiTiets?.find(
          (dg) => dg.trangThai === true
        );
        const giaBan = record.giaBan;
        if (dotGiamGia) {
          let giaSauGiam = giaBan;
          if (dotGiamGia.loaiGiamGia === "Phần trăm") {
            giaSauGiam = giaBan * (1 - dotGiamGia.giaTri / 100);
          } else if (dotGiamGia.loaiGiamGia === "Tiền mặt") {
            giaSauGiam = giaBan - dotGiamGia.giaTri;
          }
          return (
            <div>
              <span style={{ textDecoration: "line-through", color: "#999" }}>
                {giaBan?.toLocaleString()} ₫
              </span>
              <br />
              <span style={{ color: "red" }}>
                {Math.max(giaSauGiam, 0).toLocaleString()} ₫
              </span>
            </div>
          );
        }
        return giaBan?.toLocaleString() + " ₫";
      },
    },
    {
      title: "Thao tác",
      key: "action",
      render: (record) => (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => onAddProduct(record)}
          disabled={record.soLuongTon <= 0}
        >
          Thêm
        </Button>
      ),
    },
  ];

  return (
    <div className="mt-3">
      <Input.Search
        placeholder="Tìm kiếm sản phẩm..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 10, width: 300 }}
      />
      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        bordered
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: filteredData?.length || 0,
          onChange: (page, pageSize) =>
            setPagination({ current: page, pageSize: pageSize || 5 }),
        }}
      />
    </div>
  );
}