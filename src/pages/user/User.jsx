import React, { useEffect, useState } from "react";
import { Space, Table, Tag, message, Modal } from "antd";
import AddUser from "./AddUser";
import { useDispatch, useSelector } from "react-redux";
import { fetchNhanVien, deleteNhanVien } from "@/services/nhanVienService";

export default function User() {
  const dispatch = useDispatch();
  const { data } = useSelector((state) => state.nhanvien);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    dispatch(fetchNhanVien());
  }, [dispatch]);

  const handleDelete = (record) => {
    modal.confirm({
      title: "Xác nhận xóa",
      content: `Bạn có chắc muốn xóa nhân viên "${record.hoTen}" không?`,
      okText: "Xóa",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await dispatch(deleteNhanVien(record.id));
          message.success("Xóa nhân viên thành công!");
          dispatch(fetchNhanVien());
        } catch (error) {
          message.error("Xóa nhân viên thất bại!");
        }
      },
    });
  };

  const columns = [
    {
      title: "STT",
      key: "stt",
      render: (_, __, index) => index + 1,
      width: 60,
      align: "center",
    },
    { title: "MÃ NHÂN VIÊN", dataIndex: "maNhanVien", key: "maNhanVien" },
    { title: "TÊN NHÂN VIÊN", dataIndex: "hoTen", key: "hoTen" },
    {
      title: "GIỚI TÍNH",
      dataIndex: "gioiTinh",
      key: "gioiTinh",
      render: (value) => (value ? "Nam" : "Nữ"),
      align: "center",
    },
    { title: "SỐ ĐIỆN THOẠI", dataIndex: "sdt", key: "sdt" },
    { title: "ĐỊA CHỈ", dataIndex: "diaChi", key: "diaChi" },
    { title: "CHỨC VỤ", dataIndex: "chucVuName", key: "chucVuName" },
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
      <AddUser
        editingUser={editingUser}
        onFinishUpdate={() => {
          dispatch(fetchNhanVien());
          setEditingUser(null);
        }}
      />

      <div className="bg-white min-h-[500px]">
        <p className="text-[#E67E22] font-bold text-[18px] mb-4">
          Danh sách nhân viên
        </p>
        <Table
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
