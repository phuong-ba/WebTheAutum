import React, { useEffect, useState } from "react";
import { Table, message } from "antd";
import { useDispatch } from "react-redux";
import { getChiTietSanPhamBySanPham } from "@/services/chiTietSanPhamService";

export default function TableChiTietSanPham({
  sanPhamId,
  selectedRowKeys = [],
  onSelectChange,
  loaiGiamGia,
  giaTriGiam,
}) {
  const dispatch = useDispatch();
  const [data, setData] = useState([]);
  console.log("🚀 ~ TableChiTietSanPham ~ data:", data);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!sanPhamId) return setData([]);
      setLoading(true);
      try {
        const res = await dispatch(
          getChiTietSanPhamBySanPham(sanPhamId)
        ).unwrap();
        let products = Array.isArray(res.data) ? res.data : [];

        products = products.map((item) => {
          let giaSauGiam = item.giaBan;
          let soTienGiam = 0;

          if (loaiGiamGia === "Phần trăm") {
            soTienGiam = item.giaBan * (giaTriGiam / 100);
            giaSauGiam = item.giaBan - soTienGiam;
          } else if (loaiGiamGia === "Tiền mặt") {
            soTienGiam = giaTriGiam;
            giaSauGiam = item.giaBan - soTienGiam;
          }

          return {
            ...item,
            giaBanSauGiam: Math.max(giaSauGiam, 0),
            soTienGiam,
          };
        });

        setData(products);
      } catch (err) {
        console.error(err);
        message.error("Không thể tải chi tiết sản phẩm!");
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [sanPhamId, dispatch, loaiGiamGia, giaTriGiam]);

  const columns = [
    { title: "STT", render: (_, __, index) => index + 1 },
    { title: "Sản phẩm", dataIndex: "tenSanPham", render: (val) => val || "-" },
    {
      title: "Ảnh",
      dataIndex: "anhs",
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
    { title: "Màu sắc", dataIndex: "tenMauSac", render: (val) => val || "-" },
    {
      title: "Kích thước",
      dataIndex: "tenKichThuoc",
      render: (val) => val || "-",
    },
    { title: "Mã vạch", dataIndex: "maVach", render: (val) => val || "-" },
    {
      title: "Số lượng tồn",
      dataIndex: "soLuongTon",
      render: (val) => val ?? "-",
    },
    {
      title: "Đơn giá gốc",
      dataIndex: "giaBan",
      render: (val) => val?.toLocaleString() + "₫" || "-",
    },
    {
      title: "Đơn giá sau giảm",
      dataIndex: "giaBanSauGiam",
      render: (val) => val?.toLocaleString() + "₫" || "-",
    },
    { title: "Mô tả", dataIndex: "moTa", render: (val) => val || "-" },
  ];
  console.log("🚀 ~ TableChiTietSanPham ~ columns:", columns);

  return (
    <div className="mt-4">
      <p className="font-semibold text-[#E67E22] mb-2">
        Chi tiết sản phẩm {sanPhamId}
      </p>
      <Table
        rowSelection={{
          selectedRowKeys,
          onChange: onSelectChange,
          type: "checkbox",
        }}
        rowKey="id"
        columns={columns}
        dataSource={data}
        bordered
        loading={loading}
        pagination={false}
      />
    </div>
  );
}
