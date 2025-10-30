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
  PencilLineIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
} from "@phosphor-icons/react";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import UserBreadcrumb from "./UserBreadcrumb";
import { ExclamationCircleFilled } from "@ant-design/icons";

export default function User() {
  const dispatch = useDispatch();
  const { data } = useSelector((state) => state.nhanvien);
  const navigate = useNavigate();
  const [modal, contextHolder] = Modal.useModal();
  const [messageApi, messageContextHolder] = message.useMessage();
  const fileInputRef = useRef(null);
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState(null);

  const showCustomModal = (record) => {
    setSelectedRecord(record);
    setIsModalVisible(true);
  };
  useEffect(() => {
    dispatch(fetchNhanVien());
  }, [dispatch]);

  const handleConfirmStatusChange = async () => {
    if (!selectedRecord) return;
    try {
      await dispatch(
        changeStatusNhanVien({
          id: selectedRecord.id,
          trangThai: !selectedRecord.trangThai,
        })
      );
      messageApi.success(
        selectedRecord.trangThai
          ? "Khóa nhân viên thành công!"
          : "Mở khóa nhân viên thành công!"
      );
      dispatch(fetchNhanVien());
    } catch (error) {
      messageApi.error("Thao tác thất bại!");
    } finally {
      setIsModalVisible(false);
      setSelectedRecord(null);
    }
  };

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

      const existingEmails = new Set(data.map((item) => item.email));
      const existingSdts = new Set(data.map((item) => item.sdt));

      const emailsSet = new Set();
      const sdtSet = new Set();

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
          <a onClick={() => showCustomModal(record)}>
            {record.trangThai ? (
              <ToggleRightIcon weight="fill" size={30} color="#00A96C" />
            ) : (
              <ToggleLeftIcon weight="fill" size={30} color="#c5c5c5" />
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
              navigate(`/admin/update-user/${record.id}`);
            }}
          >
            <PencilLineIcon size={24} weight="fill" color="#E67E22" />
          </a>
        </Space>
      ),
    },
  ];
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

        <FliterUser
          handleExportExcel={handleExportExcel}
          handleImportExcel={handleImportExcel}
          fileInputRef={fileInputRef}
          data={data}
          navigate={navigate}
        />

        <div className="bg-white min-h-[500px] rounded-lg shadow overflow-hidden">
          <div className="flex justify-between items-center bg-[#E67E22] px-6 py-3 rounded-tl-lg rounded-tr-lg ">
            <div className="text-white font-bold text-2xl">
              Danh sách nhân viên
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
        <Modal
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={null}
          centered
          closable={false}
        >
          <div className="flex flex-col items-center gap-4 p-4">
            <ExclamationCircleFilled
              style={{ fontSize: 64, color: "#faad14" }}
            />
            <h2 className="text-xl font-bold text-center">
              {selectedRecord?.trangThai
                ? "Xác nhận khóa nhân viên"
                : "Xác nhận mở khóa nhân viên"}
            </h2>
            <p className="text-gray-600 text-center">
              Bạn có chắc muốn{" "}
              <span className="font-semibold">
                {selectedRecord?.trangThai ? "khóa" : "mở khóa"}
              </span>{" "}
              nhân viên "<strong>{selectedRecord?.hoTen}</strong>" không?
            </p>

            <div className="flex justify-center gap-6 mt-6 w-full">
              <Button
                size="large"
                className="w-40"
                onClick={() => setIsModalVisible(false)}
              >
                Hủy
              </Button>
              <Button
                type={selectedRecord?.trangThai ? "primary" : "default"}
                danger={selectedRecord?.trangThai}
                size="large"
                className="w-40"
                onClick={handleConfirmStatusChange}
              >
                {selectedRecord?.trangThai ? "Khóa" : "Mở khóa"}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
}
