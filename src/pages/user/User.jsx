import React, { useEffect, useRef } from "react";
import { Space, Table, Tag, message, Modal } from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchNhanVien,
  changeStatusNhanVien,
  addNhanVien,
} from "@/services/nhanVienService";
import FliterUser from "./FliterUser";
import { useNavigate } from "react-router";
import { LockKeyIcon, LockOpenIcon, PencilIcon } from "@phosphor-icons/react";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function User() {
  const dispatch = useDispatch();
  const { data } = useSelector((state) => state.nhanvien);
  const navigate = useNavigate();
  const [modal, contextHolder] = Modal.useModal();
  const [messageApi, messageContextHolder] = message.useMessage();
  const fileInputRef = useRef(null);

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
            onClick={() => {
              if (!record.trangThai) {
                messageApi.warning(
                  "Không thể cập nhật! Nhân viên này đã bị khóa."
                );
                return;
              }
              navigate("/update-user", { state: { user: record } });
            }}
          >
            <PencilIcon size={24} />
          </a>
        </Space>
      ),
    },
  ];
  console.log("🚀 ~ handleExportExcel ~ data:", data);
  const handleExportExcel = () => {
    if (!data || data.length === 0) {
      messageApi.warning("Không có dữ liệu để xuất!");
      return;
    }

    const exportData = data.map((item) => ({
      MaNhanVien: item.maNhanVien || "",
      HoTen: item.hoTen || "",
      GioiTinh: item.gioiTinh ? "Nam" : "Nữ",
      SoDienThoai: item.sdt || "",
      DiaChi: item.diaChi || "",
      ChucVu: item.chucVuName || "",
      Email: item.email || "",
      NgaySinh: item.ngaySinh ? dayjs(item.ngaySinh).format("DD/MM/YYYY") : "",
      NgayTao: item.ngayTao
        ? dayjs(item.ngayTao).format("DD/MM/YYYY HH:mm:ss")
        : "",
      NgaySua: item.ngaySua
        ? dayjs(item.ngaySua).format("DD/MM/YYYY HH:mm:ss")
        : "",
      HinhAnh: item.hinhAnh || "",
      TrangThai: item.trangThai ? "Đang hoạt động" : "Ngừng hoạt động",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DanhSachNhanVien");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(
      blob,
      `Danh_sach_nhan_vien_${dayjs().format("DDMMYYYY_HHmmss")}.xlsx`
    );

    messageApi.success("Xuất file Excel thành công!");
  };

  const handleImportExcel = async (file) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      if (!rows.length) {
        messageApi.warning("File Excel trống!");
        return;
      }

      for (const row of rows) {
        const payload = {
          hoTen: row.HoTen?.trim() || "",
          gioiTinh: row.GioiTinh?.toLowerCase() === "nam", 
          sdt: row.SoDienThoai?.trim() || "",
          email: row.Email?.trim() || "",
          diaChi: row.DiaChi?.trim() || "",
          ngaySinh: row.NgaySinh
            ? dayjs(row.NgaySinh, ["DD/MM/YYYY", "YYYY-MM-DD"]).toISOString()
            : null,
          chucVuId: Number(row.ChucVuId) || null,
        };

        await dispatch(addNhanVien(payload));
      }

      messageApi.success("Nhập nhân viên từ Excel thành công!");
      dispatch(fetchNhanVien());
      form.resetFields();
    } catch (error) {
      console.error(error);
      messageApi.error("Lỗi khi đọc file Excel!");
    }
  };

  return (
    <>
      {contextHolder}
      {messageContextHolder}
      <div className="bg-white flex flex-col gap-3 px-10 py-[20px]">
        <h1 className="font-bold text-4xl text-[#E67E22]">Quản lý nhân viên</h1>
      </div>

      <FliterUser />

      <div className="bg-white min-h-[500px] px-5 py-[32px]">
        <div className="flex justify-between items-center mb-5">
          <p className="text-[#E67E22] font-bold text-[18px] mb-4">
            Danh sách nhân viên
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/add-user")}
              className="border border-[#E67E22] text-[#E67E22] rounded px-10 h-8 cursor-pointer active:bg-[#E67E22] active:text-white"
            >
              Thêm mới
            </button>

            <button
              onClick={handleExportExcel}
              className="border border-[#E67E22] text-[#E67E22] rounded px-10 h-8 cursor-pointer active:bg-[#E67E22] active:text-white"
            >
              Xuất Excel
            </button>

            <input
              type="file"
              accept=".xlsx, .xls"
              hidden
              ref={fileInputRef}
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) handleImportExcel(file);
                e.target.value = "";
              }}
            />

            <button
              type="button"
              onClick={() =>
                fileInputRef.current && fileInputRef.current.click()
              }
              className="border border-[#E67E22] text-[#E67E22] rounded px-10 h-8 cursor-pointer active:bg-[#E67E22] active:text-white"
            >
              Thêm Excel
            </button>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          bordered
          pagination={{ pageSize: 10 }}
        />
      </div>
    </>
  );
}
