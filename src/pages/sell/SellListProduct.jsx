import { fetchChiTietSanPham } from "@/services/chiTietSanPhamService";
import { ShoppingCartIcon } from "@phosphor-icons/react";
import { Col, Form, Input, Row, Select, Space, Table, Tag } from "antd";
import Search from "antd/es/input/Search";
import { TrashIcon } from "lucide-react";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

export default function SellListProduct() {
  const { data } = useSelector((state) => state.chiTietSanPham);
  const dispatch = useDispatch();
  const onSearch = (value, _e, info) => console.log(info?.source, value);
  useEffect(() => {
    dispatch(fetchChiTietSanPham());
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
        { title: "Sản phẩm", dataIndex: "tenSanPham", render: (val) => val || "-" },
        { title: "Màu sắc", dataIndex: "tenMauSac", render: (val) => val || "-" },
        {
      title: "Kích thước",
      dataIndex: "tenKichThuoc",
      render: (val) => val || "-",
    },
            { title: "Trọng lượng", dataIndex: "tenTrongLuong", render: (val) => val || "-" },
    {
      title: "Số lượng",
      dataIndex: "soLuongTon",
      render: (val) => val ?? "-",
    },
    {
      title: "Đơn giá",
      dataIndex: "giaSauGiam",
      render: (val) => val?.toLocaleString() + "₫" || "-",
    },
    {
      title: "HÀNH ĐỘNG",
      key: "action",
      align: "center",
      render: (_, record) => (
        <Space size="middle">
          <a
            onClick={() => {
              if (!record.trangThai) {
                messageApi.warning(
                  "Không thể cập nhật! Nhân viên này đã bị khóa."
                );
                return;
              }
              navigate(`/admin/update-user/${record.id}`);
            }}
          >
            <div className="bg-amber-500 py-2 px-4 rounded  cursor-pointer select-none  text-center  font-bold text-white   hover:bg-amber-600 active:bg-cyan-800 shadow">
              <ShoppingCartIcon size={20} color="#FFF" />
            </div>
          </a>
        </Space>
      ),
    },
  ];
  return (
    <>
      <div className="shadow overflow-hidden rounded-lg min-h-[160px]  bg-white">
        <div className="p-4 font-bold text-2xl bg-amber-600 opacity-75 rounded-t-lg text-white">
          Danh sách sản phẩm
        </div>
        <div className="">
          <div className="flex items-center justify-end gap-2 p-4">
            <div className="flex justify-between gap-3">
              <Search placeholder="Tìm kiếm hóa đơn..." onSearch={onSearch} />
              <Select
                options={[{ label: "Demo", value: "demo" }]}
                className="min-w-[200px]"
              />
              <Select
                options={[{ label: "Demo", value: "demo" }]}
                className="min-w-[200px]"
              />
              <Select
                options={[{ label: "Demo", value: "demo" }]}
                className="min-w-[200px]"
              />
            </div>
          </div>
          <div className="flex flex-col shadow overflow-hidden gap-4 p-4">
            <Table
              columns={columns}
              dataSource={data}
              rowKey="id"
              bordered
              pagination={{ pageSize: 5 }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
