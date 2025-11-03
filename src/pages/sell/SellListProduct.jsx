import { fetchNhanVien } from "@/services/nhanVienService";
import { ShoppingCartIcon } from "@phosphor-icons/react";
import { Col, Form, Input, Row, Select, Space, Table, Tag } from "antd";
import Search from "antd/es/input/Search";
import { TrashIcon } from "lucide-react";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

export default function SellListProduct() {
  const { data } = useSelector((state) => state.nhanvien);
  const dispatch = useDispatch();
  const onSearch = (value, _e, info) => console.log(info?.source, value);
  useEffect(() => {
    dispatch(fetchNhanVien());
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
      title: "MÃ NHÂN VIÊN",
      dataIndex: "maNhanVien",
      key: "maNhanVien",
      width: 180,
    },
    { title: "TÊN NHÂN VIÊN", dataIndex: "hoTen", key: "hoTen", width: 180 },
    {
      title: "GIỚI TÍNH",
      dataIndex: "gioiTinh",
      key: "gioiTinh",
      render: (value) => (value ? "Nam" : "Nữ"),
      align: "center",
    },
    { title: "SỐ ĐIỆN THOẠI", dataIndex: "sdt", key: "sdt" },

    { title: "EMAIL", dataIndex: "email", key: "email" },
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
    { title: "CHỨC VỤ", dataIndex: "chucVuName", key: "chucVuName" },
    {
      title: "TRẠNG THÁI",
      dataIndex: "trangThai",
      key: "trangThai",
      render: (value) =>
        value ? (
          <Tag color="#E9FBF4" style={{ border: "1px solid #00A96C" }}>
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
