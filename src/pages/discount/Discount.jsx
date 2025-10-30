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
import { Eye } from "lucide-react";

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
    (async () => {
      try {
        const needUpdate = data.filter((item) => {
          const start = dayjs(item.ngayBatDau);
          const end = dayjs(item.ngayKetThuc);

          if (item.trangThai === true && end.isBefore(now, "day")) {
            return true;
          }
          if (item.trangThai === true && start.isAfter(now, "day")) {
            return true;
          }
          return false;
        });

        if (needUpdate.length === 0) return;

        await Promise.all(
          needUpdate.map((item) => {
            const start = dayjs(item.ngayBatDau);
            const end = dayjs(item.ngayKetThuc);
            let newStatus = false;

            return dispatch(
              changeStatusPhieuGiamGia({ id: item.id, trangThai: newStatus })
            );
          })
        );

        dispatch(fetchPhieuGiamGia());
        messageApi.info(`Đã tự động cập nhật ${needUpdate.length} phiếu.`);
      } catch (err) {
        console.error("Lỗi khi tự động cập nhật trạng thái:", err);
        messageApi.error("Có lỗi khi tự động cập nhật trạng thái phiếu.");
      }
    })();
  }, [data, dispatch, messageApi]);

  const handleChangeStatus = (record) => {
    const now = dayjs();
    const start = dayjs(record.ngayBatDau);
    const end = dayjs(record.ngayKetThuc);
    let canChange = true;
    let message = "";
    if (!record.trangThai && end.isBefore(now, "day")) {
      canChange = false;
      message = "Không thể kích hoạt phiếu đã hết hạn";
    } else if (start.isAfter(now, "day")) {
      canChange = false;
      message = "Không thể thay đổi trạng thái phiếu chưa đến ngày bắt đầu";
    }
    if (!canChange) {
      messageApi.warning(message);
      return;
    }
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
            const payload = result.payload || "Cập nhật trạng thái thất bại";
            throw new Error(payload);
          }
        } catch (err) {
          console.error("Lỗi khi cập nhật trạng thái:", err);
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

    const exportData = data.map((item, index) => {
      const now = new Date();
      const startDate = new Date(item.ngayBatDau);
      const endDate = new Date(item.ngayKetThuc);

      let trangThaiText = "";

      if (now < startDate) {
        trangThaiText = "Sắp diễn ra";
      } else if (now > endDate) {
        trangThaiText = "Đã kết thúc";
      } else {
        trangThaiText = "Đang diễn ra";
      }

      return {
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
        "Trạng thái": trangThaiText,
      };
    });

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
      render: (r) => {
        const mainValue = r.loaiGiamGia
          ? `${r.giaTriGiamGia.toLocaleString()} VNĐ`
          : `${r.giaTriGiamGia}%`;

        const minOrder =
          r.giaTriDonHangToiThieu || r.giaTriDonHangToiThieu === 0
            ? r.giaTriDonHangToiThieu
            : null;

        const maxDiscount =
          r.mucGiaGiamToiDa || r.mucGiaGiamToiDa === 0
            ? r.mucGiaGiamToiDa
            : null;

        let subText = "";
        if (minOrder) {
          subText = `Đơn hàng tối thiểu: ${Number(
            minOrder
          ).toLocaleString()} VNĐ`;
        } else if (maxDiscount) {
          subText = `Mức giảm tối đa: ${Number(
            maxDiscount
          ).toLocaleString()} VNĐ`;
        }

        return (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 600 }}>{mainValue}</div>
            {subText && (
              <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                {subText}
              </div>
            )}
          </div>
        );
      },
      align: "center",
    },
    {
      title: "SỐ LƯỢNG",
      dataIndex: "soLuongDung",
      key: "soLuongDung",
      align: "center",
      render: (soLuong) => soLuong || 0,
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
        const end = dayjs(record.ngayKetThuc);

        let status = "";
        let color = "";
        let displayStatus = "";

        if (end.isBefore(now, "day")) {
          status = "Đã kết thúc";
          color = "#E74C3C";
          displayStatus = "Đã kết thúc";
        } else if (start.isAfter(now, "day")) {
          status = "Sắp diễn ra";
          color = "#FFA500";
          displayStatus = "Sắp diễn ra";
        } else {
          if (record.trangThai) {
            status = "Đang diễn ra";
            color = "#00A96C";
            displayStatus = "Đang diễn ra";
          } else {
            status = "Đã kết thúc";
            color = "#E74C3C";
            displayStatus = "Đã kết thúc";
          }
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
            <div style={{ color }}>{displayStatus}</div>
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
            onClick={() => {
              if (record.trangThai === false) {
                messageApi.warning("Không thể chỉnh sửa phiếu giảm giá!");
                return;
              }
              navigate("/admin/update-discount", { state: { phieuGiamGia: record } });
            }}
          >
            <Eye
              size={20}
              color={record.trangThai === false ? "#ccc" : "#00A96C"}
              style={{
                cursor: record.trangThai === false ? "not-allowed" : "pointer",
              }}
            />
          </a>

          <a onClick={() => handleChangeStatus(record)}>
            {record.trangThai ? (
              <ToggleRightIcon weight="fill" size={30} color="#00A96C" />
            ) : (
              <ToggleLeftIcon weight="fill" size={30} color="#E67E22" />
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
      <div className="p-6 flex flex-col gap-10">
        <div className="bg-white flex flex-col gap-3 px-4 py-[20px] rounded-lg shadow overflow-hidden">
          <div className="font-bold text-4xl text-[#E67E22]">
            Quản lý phiếu giảm giá
          </div>
          <DiscountBreadcrumb />
        </div>
        <FliterDiscount />
        <div className="bg-white min-h-[500px] rounded-lg shadow overflow-hidden">
          <div className="flex justify-between items-center bg-[#E67E22] px-6 py-3 rounded-tl-lg rounded-tr-lg">
            <div className="text-white font-bold text-2xl">
              Danh sách phiếu giảm
            </div>
            <div className="flex gap-3">
              <div
                onClick={() => navigate("/add-discount")}
                className="bg-white text-[#E67E22] rounded px-6 py-2 cursor-pointer hover:bg-gray-100 hover:text-[#d35400] active:border-[#d35400] transition-colors font-bold"
              >
                Thêm mới
              </div>
              <div
                onClick={handleExportExcel}
                className="bg-white text-[#E67E22] rounded px-6 py-2 cursor-pointer hover:bg-gray-100 hover:text-[#d35400] transition-colors font-bold"
              >
                Xuất Excel
              </div>
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
      </div>
    </>
  );
}
