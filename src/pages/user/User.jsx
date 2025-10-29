import React, { useEffect, useRef } from "react";
import { Space, Table, Tag, message, Modal, Button } from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchNhanVien,
  changeStatusNhanVien,
  addNhanVien,
} from "@/services/nhanVienService";
import FliterUser from "./FliterUser";
import { useNavigate } from "react-router";
import {
  LockKeyIcon,
  LockOpenIcon,
  PencilIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
} from "@phosphor-icons/react";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import UserBreadcrumb from "./UserBreadcrumb";

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
              <ToggleRightIcon weight="fill" size={30} color="#00A96C" />
            ) : (
              <ToggleLeftIcon weight="fill" size={30} color="#E67E22" />
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
              navigate(`/update-user/${record.id}`);
            }}
          >
            <PencilIcon size={24} />
          </a>
        </Space>
      ),
    },
  ];
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
      const dataExcel = await file.arrayBuffer();
      const workbook = XLSX.read(dataExcel);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      if (!rows.length) {
        messageApi.warning("File Excel trống!");
        return;
      }

      let errorCount = 0;

      // Lấy danh sách email và sdt hiện có trong hệ thống
      const existingEmails = new Set(data.map((item) => item.email));
      const existingSdts = new Set(data.map((item) => item.sdt));

      const emailsSet = new Set(); // kiểm tra trùng trong file
      const sdtSet = new Set(); // kiểm tra trùng trong file

      for (const [index, row] of rows.entries()) {
        const hoTen = String(row.HoTen ?? "").trim();
        const gioiTinh = String(row.GioiTinh ?? "").toLowerCase() === "nam";
        const sdt = String(row.SoDienThoai ?? "").trim();
        const email = String(row.Email ?? "").trim();
        const diaChi = String(row.DiaChi ?? "").trim();
        const ngaySinh = row.NgaySinh
          ? dayjs(row.NgaySinh, ["DD/MM/YYYY", "YYYY-MM-DD"]).toISOString()
          : null;

        let rowHasError = false;

        // Kiểm tra email
        if (!email) {
          messageApi.error(`Dòng ${index + 1}: Email không được để trống`);
          rowHasError = true;
        } else if (emailsSet.has(email)) {
          messageApi.error(`Dòng ${index + 1}: Email trùng trong file`);
          rowHasError = true;
        } else if (existingEmails.has(email)) {
          messageApi.error(
            `Dòng ${index + 1}: Email đã tồn tại trong hệ thống`
          );
          rowHasError = true;
        } else {
          emailsSet.add(email);
        }

        // Kiểm tra sđt
        if (!sdt.startsWith("0")) {
          messageApi.error(
            `Dòng ${index + 1}: Số điện thoại phải bắt đầu bằng số 0`
          );
          rowHasError = true;
        } else if (sdtSet.has(sdt)) {
          messageApi.error(`Dòng ${index + 1}: Số điện thoại trùng trong file`);
          rowHasError = true;
        } else if (existingSdts.has(sdt)) {
          messageApi.error(
            `Dòng ${index + 1}: Số điện thoại đã tồn tại trong hệ thống`
          );
          rowHasError = true;
        } else {
          sdtSet.add(sdt);
        }

        if (rowHasError) {
          errorCount++;
          continue;
        }

        const payload = { hoTen, gioiTinh, sdt, email, diaChi, ngaySinh };

        try {
          await dispatch(addNhanVien(payload)).unwrap();
          existingEmails.add(email);
          existingSdts.add(sdt);
          messageApi.success(`Dòng ${index + 1} thêm thành công`);
        } catch (error) {
          errorCount++;
          const msg =
            error?.response?.data?.message ||
            error?.payload?.message ||
            error?.message ||
            "Lỗi thêm nhân viên";
          messageApi.error(`Dòng ${index + 1}: ${msg}`);
        }
      }

      dispatch(fetchNhanVien());
    } catch (error) {
      console.error(error);
      messageApi.error("Lỗi khi đọc file Excel!");
    }
  };

  return (
    <>
      {contextHolder}
      {messageContextHolder}
      <div className="p-6 flex flex-col gap-10">
        <div className="bg-white flex flex-col gap-3 px-4 py-[20px] rounded-lg shadow overflow-hidden">
          <div className="font-bold text-4xl text-[#E67E22]">
            Quản lý nhân viên
          </div>
          <UserBreadcrumb />
        </div>

        <FliterUser />

        <div className="bg-white min-h-[500px] rounded-lg shadow overflow-hidden">
          <div className="flex justify-between items-center bg-[#E67E22] px-6 py-3 rounded-tl-lg rounded-tr-lg ">
            <div className="text-white font-bold text-2xl">
              Danh sách nhân viên
            </div>
            <div className="flex gap-3">
              <div
                onClick={() => navigate("/add-user")}
                className="bg-white font-bold text-[#E67E22] rounded px-6 py-2 cursor-pointer hover:bg-gray-100 hover:text-[#d35400] active:border-[#d35400] transition-colors "
              >
                Thêm mới
              </div>

              <div
                onClick={handleExportExcel}
                disabled={!data || data.length === 0}
                className="bg-white text-[#E67E22] rounded px-6 py-2 cursor-pointer hover:bg-gray-100 hover:text-[#d35400] transition-colors font-bold"
              >
                Xuất Excel
              </div>

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

              <div
                type="button"
                onClick={() =>
                  fileInputRef.current && fileInputRef.current.click()
                }
                className="bg-white text-[#E67E22] rounded px-6 py-2 cursor-pointer hover:bg-gray-100 hover:text-[#d35400] transition-colors font-bold"
              >
                Thêm Excel
              </div>
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
      </div>
    </>
  );
}
