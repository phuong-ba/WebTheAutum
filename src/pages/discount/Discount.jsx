import React, { useEffect, useState, useRef } from "react";
import { Space, Table, Tag, Modal, message, Breadcrumb, Button } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  changeStatusPhieuGiamGia,
  fetchPhieuGiamGia,
} from "@/services/phieuGiamGiaService";
import { ToggleRightIcon, PencilLineIcon } from "@phosphor-icons/react";
import FliterDiscount from "./FliterDiscount";
import DiscountBreadcrumb from "@/pages/discount/DiscountBreadcrumb";
import { Eye } from "lucide-react";
import { ExclamationCircleFilled } from "@ant-design/icons";

export default function Discount() {
  const dispatch = useDispatch();
  const { data, loading } = useSelector((state) => state.phieuGiamGia);
  const navigate = useNavigate();
  const [messageApi, messageContextHolder] = message.useMessage();
  const [modal, contextHolder] = Modal.useModal();
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState(null);

  // Thêm state để theo dõi lần cuối cập nhật
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    dispatch(fetchPhieuGiamGia());
  }, [dispatch]);

  const showCustomModal = (record) => {
    setSelectedRecord(record);
    setIsModalVisible(true);
  };

  // Hàm tính toán trạng thái mới dựa trên thời gian và số lượng
  const calculateNewStatus = (item) => {
    const now = dayjs();
    const start = dayjs(item.ngayBatDau);
    const end = dayjs(item.ngayKetThuc);

    // Ưu tiên kiểm tra số lượng trước
    if (item.soLuongDung === 0) {
      return 2; // Đã kết thúc (hết số lượng)
    }

    // Kiểm tra thời gian
    if (now.isAfter(end)) {
      return 2; // Đã kết thúc (quá hạn)
    } else if (now.isBefore(start)) {
      return 0; // Sắp diễn ra
    } else {
      return 1; // Đang diễn ra
    }
  };

  // Hàm kiểm tra và cập nhật trạng thái - ĐƠN GIẢN HÓA
  const checkAndUpdateStatus = async () => {
    if (!data || data.length === 0) return;

    try {
      const needUpdate = data.filter((item) => {
        const newStatus = calculateNewStatus(item);
        return item.trangThai !== newStatus;
      });

      if (needUpdate.length === 0) return;

      console.log(`Cần cập nhật ${needUpdate.length} phiếu:`, needUpdate);

      // Cập nhật từng cái một để tránh lỗi
      for (const item of needUpdate) {
        const newStatus = calculateNewStatus(item);
        console.log(
          `Cập nhật phiếu ${item.maGiamGia} từ ${item.trangThai} -> ${newStatus}`
        );

        await dispatch(
          changeStatusPhieuGiamGia({
            id: item.id,
            trangThai: newStatus,
          })
        );

        // Delay nhẹ giữa các request
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Cập nhật lại data sau khi đã cập nhật tất cả
      await dispatch(fetchPhieuGiamGia());
      setLastUpdate(Date.now());

      if (needUpdate.length > 0) {
        messageApi.info(
          `Đã tự động cập nhật trạng thái cho ${needUpdate.length} phiếu.`
        );
      }
    } catch (err) {
      console.error("Lỗi khi tự động cập nhật trạng thái:", err);
      messageApi.error("Có lỗi khi tự động cập nhật trạng thái phiếu.");
    }
  };

  // Chạy kiểm tra trạng thái khi data thay đổi
  useEffect(() => {
    checkAndUpdateStatus();
  }, [data]);

  // Thêm interval để kiểm tra định kỳ (mỗi 30 giây)
  useEffect(() => {
    const interval = setInterval(() => {
      checkAndUpdateStatus();
    }, 30000); // 30 giây

    return () => clearInterval(interval);
  }, [data]);

  const handleConfirmChangeStatus = async () => {
    if (!selectedRecord) return;

    const now = dayjs();
    const start = dayjs(selectedRecord.ngayBatDau);
    const end = dayjs(selectedRecord.ngayKetThuc);

    // Kiểm tra điều kiện trước khi thay đổi trạng thái thủ công
    if (selectedRecord.soLuongDung === 0) {
      messageApi.warning("Không thể thay đổi trạng thái phiếu đã hết số lượng");
      return;
    }

    if (now.isAfter(end)) {
      messageApi.warning("Không thể thay đổi trạng thái phiếu đã hết hạn");
      return;
    }

    if (now.isBefore(start)) {
      messageApi.warning(
        "Không thể thay đổi trạng thái phiếu chưa đến ngày bắt đầu"
      );
      return;
    }

    try {
      await dispatch(
        changeStatusPhieuGiamGia({
          id: selectedRecord.id,
          trangThai: selectedRecord.trangThai === 1 ? 2 : 1,
        })
      );

      messageApi.success(
        selectedRecord.trangThai
          ? "Kết thúc phiếu giảm giá thành công!"
          : "Kích hoạt phiếu giảm giá thành công!"
      );

      // Cập nhật lại data ngay lập tức
      await dispatch(fetchPhieuGiamGia());
      setLastUpdate(Date.now());
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái:", error);
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

    const exportData = data.map((item, index) => {
      const now = new Date();
      const startDate = new Date(item.ngayBatDau);
      const endDate = new Date(item.ngayKetThuc);

      let trangThaiText = "";

      // Logic hiển thị trạng thái cho export Excel
      if (item.trangThai === 2) {
        trangThaiText = "Đã kết thúc";
      } else if (now < startDate) {
        trangThaiText = "Sắp diễn ra";
      } else if (now > endDate) {
        trangThaiText = "Đã kết thúc";
      } else {
        trangThaiText = item.trangThai === 1 ? "Đang diễn ra" : "Đã kết thúc";
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

  // Hàm hiển thị trạng thái cho table - ĐƠN GIẢN HÓA
  const renderTrangThai = (_, record) => {
    const now = dayjs();
    const start = dayjs(record.ngayBatDau);
    const end = dayjs(record.ngayKetThuc);

    let status = "";
    let color = "";
    let displayStatus = "";

    // Logic đơn giản, đồng nhất với hàm calculateNewStatus
    if (
      record.trangThai === 2 ||
      record.soLuongDung === 0 ||
      now.isAfter(end)
    ) {
      status = "Đã kết thúc";
      color = "#E74C3C";
      displayStatus = "Đã kết thúc";
    } else if (now.isBefore(start)) {
      status = "Sắp diễn ra";
      color = "#FFA500";
      displayStatus = "Sắp diễn ra";
    } else {
      status = "Đang diễn ra";
      color = "#00A96C";
      displayStatus = "Đang diễn ra";
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
  };

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
      render: renderTrangThai,
    },
    {
      title: "HÀNH ĐỘNG",
      key: "action",
      align: "center",
      render: (_, record) => {
        const now = dayjs();
        const start = dayjs(record.ngayBatDau);
        const end = dayjs(record.ngayKetThuc);

        // Chỉ cho phép thay đổi trạng thái khi phiếu đang trong thời gian hiệu lực
        const canChangeStatus =
          record.trangThai !== 2 &&
          record.soLuongDung > 0 &&
          now.isAfter(start) &&
          now.isBefore(end);

        return (
          <Space size="middle">
            {canChangeStatus && (
              <a onClick={() => showCustomModal(record)}>
                <ToggleRightIcon
                  weight="fill"
                  size={30}
                  color={record.trangThai === 1 ? "#00A96C" : "#E67E22"}
                />
              </a>
            )}
            <a
              onClick={() => {
                if (record.trangThai !== 1) {
                  messageApi.warning(
                    "Chỉ có thể chỉnh sửa phiếu đang diễn ra!"
                  );
                  return;
                }
                navigate("/admin/update-discount", {
                  state: { phieuGiamGia: record },
                });
              }}
            >
              <PencilLineIcon
                size={24}
                weight="fill"
                color={record.trangThai === 1 ? "#E67E22" : "#ccc"}
                style={{
                  cursor: record.trangThai === 1 ? "pointer" : "not-allowed",
                }}
              />
            </a>
          </Space>
        );
      },
    },
  ];

  return (
    <>
      {contextHolder}
      {messageContextHolder}
      <div className="p-6 flex flex-col gap-5">
        <div className="bg-white flex flex-col gap-3 px-4 py-[20px] rounded-lg shadow overflow-hidden">
          <div className="font-bold text-4xl text-[#E67E22]">
            Quản lý phiếu giảm giá
          </div>
          <DiscountBreadcrumb />
        </div>
        <FliterDiscount handleExportExcel={handleExportExcel} />
        <div className="bg-white min-h-[500px] rounded-lg shadow overflow-hidden">
          <div className="flex justify-between items-center bg-[#E67E22] px-6 py-3 rounded-tl-lg rounded-tr-lg">
            <div className="text-white font-bold text-2xl">
              Danh sách phiếu giảm
            </div>
            <div className="flex gap-3"></div>
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
            key={lastUpdate} // Thêm key để trigger re-render khi có thay đổi
          />
        </div>
      </div>
      <Modal
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        centered
        closable={false}
      >
        <div className="flex flex-col items-center gap-4 p-4">
          <ExclamationCircleFilled style={{ fontSize: 64, color: "#faad14" }} />
          <h2 className="text-xl font-bold text-center">
            {selectedRecord?.trangThai === 1
              ? "Xác nhận kết thúc phiếu"
              : "Xác nhận kích hoạt phiếu"}
          </h2>
          <p className="text-gray-600 text-center">
            Bạn có chắc muốn{" "}
            <span className="font-semibold">
              {selectedRecord?.trangThai === 1 ? "kết thúc" : "kích hoạt"}
            </span>{" "}
            phiếu giảm giá "<strong>{selectedRecord?.tenChuongTrinh}</strong>"
            không?
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
              type={selectedRecord?.trangThai === 1 ? "primary" : "default"}
              danger={selectedRecord?.trangThai === 1}
              size="large"
              className="w-40"
              onClick={handleConfirmChangeStatus}
            >
              {selectedRecord?.trangThai === 1 ? "Kết thúc" : "Kích hoạt"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
