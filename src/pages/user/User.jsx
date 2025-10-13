import React, { useEffect, useState } from "react";
import { Space, Table, Tag, message, Modal } from "antd";
import AddUser from "./AddUser";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchNhanVien,
  changeStatusNhanVien,
  deleteNhanVien,
} from "@/services/nhanVienService";
import FliterUser from "./FliterUser";
import { useNavigate } from "react-router";
import {
  LockKeyIcon,
  LockOpenIcon,
  PencilIcon,
  TrashIcon,
} from "@phosphor-icons/react";

export default function User() {
  const dispatch = useDispatch();
  const { data } = useSelector((state) => state.nhanvien);
  const navigate = useNavigate();
  const [modal, contextHolder] = Modal.useModal();
  const [messageApi, messageContextHolder] = message.useMessage();
  useEffect(() => {
    dispatch(fetchNhanVien());
  }, [dispatch]);
  const handleChangeStatus = (record) => {
    if (record.trangThai) {
      modal.confirm({
        title: "Xác nhận khóa",
        content: `Bạn có chắc muốn khóa nhân viên "${record.hoTen}" không?`,
        okText: "Khóa",
        cancelText: "Hủy",
        okButtonProps: { danger: true },
        onOk: async () => {
          try {
            await dispatch(
              changeStatusNhanVien({
                id: record.id,
                trangThai: false,
              })
            );
            messageApi.success("Khóa nhân viên thành công!");
            dispatch(fetchNhanVien());
          } catch (error) {
            messageApi.error("Khóa nhân viên thất bại!");
          }
        },
      });
    } else {
      (async () => {
        try {
          await dispatch(
            changeStatusNhanVien({
              id: record.id,
              trangThai: true,
            })
          );
          messageApi.success("Mở khóa nhân viên thành công!");
          dispatch(fetchNhanVien());
        } catch (error) {
          messageApi.error("Mở khóa nhân viên thất bại!");
        }
      })();
    }
  };

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
          messageApi.success("Xóa nhân viên thành công!");
          dispatch(fetchNhanVien());
        } catch (error) {
          messageApi.error("Xóa nhân viên thất bại!");
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
          <a onClick={() => handleChangeStatus(record)}>
            {record.trangThai ? (
              <LockKeyIcon size={24} color="#E67E22" />
            ) : (
              <LockOpenIcon size={24} color="#00A96C" />
            )}
          </a>
          <a
            onClick={() =>
              navigate("/update-user", { state: { user: record } })
            }
          >
            <PencilIcon size={24} />
          </a>
          <a onClick={() => handleDelete(record)}>
            <TrashIcon size={24} color="#b30000" />
          </a>
        </Space>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      {messageContextHolder}
      <FliterUser />
      <div className="bg-white min-h-[500px] px-5 py-[32px]">
        <div className="flex justify-between items-center mb-5">
          <p className="text-[#E67E22] font-bold text-[18px] mb-4">
            Danh sách nhân viên
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/add-user")}
              className="border border-[#E67E22] text-[#E67E22] rounded px-10  h-8 cursor-pointer active:bg-[#E67E22] active:text-white"
            >
              Thêm mới
            </button>
            <button
              onClick={() => navigate("/add-product")}
              className="border border-[#E67E22] text-[#E67E22] rounded px-10  h-8 cursor-pointer active:bg-[#E67E22] active:text-white"
            >
              Xuất dữ liệu
            </button>
            <button
              onClick={() => navigate("/add-product")}
              className="border border-[#E67E22] text-[#E67E22] rounded px-10  h-8 cursor-pointer active:bg-[#E67E22] active:text-white"
            >
              In danh sách
            </button>
          </div>
        </div>
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
