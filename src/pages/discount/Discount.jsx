import React, { useEffect, useState } from "react";
import { Space, Table, Tag, Modal, message, Breadcrumb } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  changeStatusPhieuGiamGia,
  fetchPhieuGiamGia,
} from "@/services/phieuGiamGiaService";
import {
  ToggleLeftIcon,
  ToggleRightIcon,
  PencilIcon,
} from "@phosphor-icons/react";
import FliterDiscount from "./FliterDiscount";
import DiscountBreadcrumb from "@/components/DiscountBreadcrumb";

export default function Discount() {
  const dispatch = useDispatch();
  const { data, loading } = useSelector((state) => state.phieuGiamGia);
  const navigate = useNavigate();
  const [messageApi, messageContextHolder] = message.useMessage();
  const [modal, contextHolder] = Modal.useModal();

  useEffect(() => {
    dispatch(fetchPhieuGiamGia());
  }, [dispatch]);

  useEffect(() => {
    if (!data || data.length === 0) return;

    const now = dayjs();

    const expired = data.filter(
      (item) =>
        item.trangThai === true && dayjs(item.ngayKetThuc).isBefore(now, "day")
    );

    if (expired.length === 0) return;

    (async () => {
      try {
        await Promise.all(
          expired.map((item) =>
            dispatch(
              changeStatusPhieuGiamGia({ id: item.id, trangThai: false })
            )
          )
        );

        dispatch(fetchPhieuGiamGia());
        messageApi.info(`Đã tự động cập nhật ${expired.length} phiếu hết hạn.`);
      } catch (err) {
        console.error("Lỗi khi tự động cập nhật trạng thái:", err);
        messageApi.error("Có lỗi khi tự động cập nhật trạng thái phiếu.");
      }
    })();
  }, [data, dispatch, messageApi]);

  const handleChangeStatus = (record) => {
    const action = record.trangThai ? "Kết thúc" : "Kích hoạt";
    const newStatus = !record.trangThai;

    modal.confirm({
      title: `Xác nhận ${action}`,
      content: `Bạn có chắc muốn ${action} phiếu "${record.tenChuongTrinh}" không?`,
      okText: action,
      cancelText: "Hủy",
      okButtonProps: { danger: action === "Kết thúc" },
      async onOk() {
        try {
          const result = await dispatch(
            changeStatusPhieuGiamGia({ id: record.id, trangThai: newStatus })
          );
          if (changeStatusPhieuGiamGia.fulfilled.match(result)) {
            messageApi.success(`Đã ${action} phiếu giảm giá thành công!`);
            dispatch(fetchPhieuGiamGia());
          } else {
            const payload = result.payload || "Đổi trạng thái thất bại";
            throw new Error(payload);
          }
        } catch (err) {
          console.error(err);
          const msg = err?.message || "Cập nhật trạng thái thất bại";
          messageApi.error(msg);
        }
      },
    });
  };

  const handleExportExcel = () => {
    if (!data || data.length === 0) {
      messageApi.warning("Không có dữ liệu để xuất!");
      return;
    }
    const exportData = data.map((item, index) => ({
      STT: index + 1,
      "Mã giảm giá": item.maGiamGia,
      "Tên chương trình": item.tenChuongTrinh,
      Kiểu: item.kieu === 0 ? "Công khai" : "Cá nhân",
      "Giá trị":
        item.loaiGiamGia === true
          ? `${item.giaTriGiamGia.toLocaleString()} VNĐ`
          : `${item.giaTriGiamGia}%`,
      "Ngày bắt đầu": new Date(item.ngayBatDau).toLocaleDateString("vi-VN"),
      "Ngày kết thúc": new Date(item.ngayKetThuc).toLocaleDateString("vi-VN"),
      "Trạng thái": item.trangThai ? "Đang diễn ra" : "Đã kết thúc",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "PhieuGiamGia");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `Danh_sach_phieu_giam_gia_${dayjs().format("DDMMYYYY")}.xlsx`);
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
      width: 60,
      align: "center",
    },
    { title: "MÃ GIẢM GIÁ", dataIndex: "maGiamGia", key: "maGiamGia" },
    {
      title: "TÊN CHƯƠNG TRÌNH",
      dataIndex: "tenChuongTrinh",
      key: "tenChuongTrinh",
    },
    {
      title: "KIỂU",
      dataIndex: "kieu",
      key: "kieu",
      render: (v) =>
        v ? (
          <Tag color="#E9FBF4" style={{ border: "1px solid #00A96C" }}>
            <div className="text-[#00A96C] ">Cá nhân</div>
          </Tag>
        ) : (
          <Tag color="red">Công khai</Tag>
        ),
      align: "center",
    },
    {
      title: "GIÁ TRỊ",
      key: "giaTriGiamGia",
      render: (r) =>
        r.loaiGiamGia
          ? `${r.giaTriGiamGia.toLocaleString()} VNĐ`
          : `${r.giaTriGiamGia}%`,
      align: "center",
    },
    {
      title: "NGÀY BẮT ĐẦU",
      dataIndex: "ngayBatDau",
      key: "ngayBatDau",
      render: (d) => new Date(d).toLocaleDateString("vi-VN"),
      align: "center",
    },
    {
      title: "NGÀY KẾT THÚC",
      dataIndex: "ngayKetThuc",
      key: "ngayKetThuc",
      render: (d) => new Date(d).toLocaleDateString("vi-VN"),
      align: "center",
    },
    {
      title: "TRẠNG THÁI",
      dataIndex: "trangThai",
      key: "trangThai",
      align: "center",
      render: (_, record) => {
        const now = dayjs();
        const start = dayjs(record.ngayBatDau);

        let status = "";
        let color = "";

        if (!record.trangThai) {
          status = "Đã kết thúc";
          color = "#E74C3C";
        } else if (start.isAfter(now, "day")) {
          status = "Sắp diễn ra";
          color = "#FFA500";
        } else {
          status = "Đang diễn ra";
          color = "#00A96C";
        }

        return (
          <Tag
            color={
              status === "Sắp diễn ra"
                ? "#FFF4E0"
                : status === "Đang diễn ra"
                ? "#E9FBF4"
                : "#FFEAE3"
            }
            style={{ border: `1px solid ${color}` }}
          >
            <div style={{ color }}>{status}</div>
          </Tag>
        );
      },
    },
    {
      title: "HÀNH ĐỘNG",
      key: "action",
      align: "center",
      render: (_, record) => (
        <Space size="middle">
          <a
            onClick={() =>
              navigate("/update-discount", { state: { phieuGiamGia: record } })
            }
          >
            <PencilIcon size={24} />
          </a>
          <a onClick={() => handleChangeStatus(record)}>
            {record.trangThai ? (
              <ToggleRightIcon size={24} color="#00A96C" />
            ) : (
              <ToggleLeftIcon size={24} color="#E67E22" />
            )}
          </a>
        </Space>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      {messageContextHolder}
      <div className="bg-white flex flex-col gap-3 px-10 py-[20px]">
        <h1 className="font-bold text-4xl text-[#E67E22]">
          Quản lý phiếu giảm giá
        </h1>
        <DiscountBreadcrumb />
      </div>
      <FliterDiscount />
      <div className="bg-white min-h-[500px] px-5 py-[32px]">
        <div className="flex justify-between items-center mb-5">
          <p className="text-[#E67E22] font-bold text-[18px] mb-4">
            Danh sách phiếu giảm giá
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/add-discount")}
              className="border border-[#E67E22] text-[#E67E22] rounded px-10 h-8 cursor-pointer active:bg-[#E67E22] active:text-white"
            >
              Thêm mới
            </button>
            <button
              onClick={handleExportExcel}
              className="border border-[#E67E22] text-[#E67E22] rounded px-10 h-8 cursor-pointer active:bg-[#E67E22] active:text-white"
            >
              Xuất EXCEL
            </button>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          bordered
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            onChange: (page, pageSize) =>
              setPagination({ current: page, pageSize }),
          }}
        />
      </div>
    </>
  );
}
