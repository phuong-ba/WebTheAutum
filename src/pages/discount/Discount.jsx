import React, { useEffect, useState } from "react";
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
import {
  ToggleRightIcon,
  PencilLineIcon,
} from "@phosphor-icons/react";
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
  console.log("🚀 ~ Discount ~ selectedRecord:", selectedRecord);
  useEffect(() => {
    dispatch(fetchPhieuGiamGia());
  }, [dispatch]);
  const showCustomModal = (record) => {
    setSelectedRecord(record);
    setIsModalVisible(true);
  };
 useEffect(() => {
  if (!data || data.length === 0) return;
  const now = dayjs();

  (async () => {
    try {
      const needUpdate = data.filter((item) => {
        const start = dayjs(item.ngayBatDau);
        const end = dayjs(item.ngayKetThuc);

        let calculatedStatus = -1;
        if (start.isAfter(now, "day")) {
          calculatedStatus = 0; 
        } else if ((start.isBefore(now, "day") || start.isSame(now, "day")) &&
                   (end.isAfter(now, "day") || end.isSame(now, "day"))) {
          calculatedStatus = 1; 
        } else if (end.isBefore(now, "day")) {
          calculatedStatus = 2; 
        }

        return item.trangThai !== calculatedStatus;
      });

      if (needUpdate.length === 0) return;

      await Promise.all(
        needUpdate.map((item) => {
          const start = dayjs(item.ngayBatDau);
          const end = dayjs(item.ngayKetThuc);
          let newStatus = 0;

          if (start.isAfter(now, "day")) {
            newStatus = 0;
          } else if ((start.isBefore(now, "day") || start.isSame(now, "day")) &&
                     (end.isAfter(now, "day") || end.isSame(now, "day"))) {
            newStatus = 1;
          } else if (end.isBefore(now, "day")) {
            newStatus = 2;
          }

          return dispatch(
            changeStatusPhieuGiamGia({ id: item.id, trangThai: newStatus })
          );
        })
      );

      dispatch(fetchPhieuGiamGia());
      messageApi.info(`Đã tự động cập nhật trạng thái cho ${needUpdate.length} phiếu.`);
    } catch (err) {
      console.error("Lỗi khi tự động cập nhật trạng thái:", err);
      messageApi.error("Có lỗi khi tự động cập nhật trạng thái phiếu.");
    }
  })();
}, [data, dispatch, messageApi]);

  const handleConfirmChangeStatus = async () => {
    if (!selectedRecord) return;

    const now = dayjs();
    const start = dayjs(selectedRecord.ngayBatDau);
    const end = dayjs(selectedRecord.ngayKetThuc);

    if (!selectedRecord.trangThai && end.isBefore(now, "day")) {
      messageApi.warning("Không thể kích hoạt phiếu đã hết hạn");
      return;
    } else if (start.isAfter(now, "day")) {
      messageApi.warning(
        "Không thể thay đổi trạng thái phiếu chưa đến ngày bắt đầu"
      );
      return;
    }

    try {
      await dispatch(
        changeStatusPhieuGiamGia({
          id: selectedRecord.id,
          trangThai: !selectedRecord.trangThai,
        })
      );

      messageApi.success(
        selectedRecord.trangThai
          ? "Kết thúc phiếu giảm giá thành công!"
          : "Kích hoạt phiếu giảm giá thành công!"
      );

      dispatch(fetchPhieuGiamGia());
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
      {record.trangThai === 1 && (
        <a onClick={() => showCustomModal(record)}>
          <ToggleRightIcon weight="fill" size={30} color="#00A96C" />
        </a>
      )}
      <a
        onClick={() => {
          if (record.trangThai !== 1) {
            messageApi.warning("Chỉ có thể chỉnh sửa phiếu đang diễn ra!");
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
  ),
}
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
            {selectedRecord?.trangThai
              ? "Xác nhận kết thúc phiếu"
              : "Xác nhận mở phiếu"}
          </h2>
          <p className="text-gray-600 text-center">
            Bạn có chắc muốn{" "}
            <span className="font-semibold">
              {selectedRecord?.trangThai ? "Kết thúc phiếu" : "Mở phiếu"}
            </span>{" "}
            "<strong>{selectedRecord?.tenChuongTrinh}</strong>" không?
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
              onClick={handleConfirmChangeStatus}
            >
              {selectedRecord?.trangThai ? "Khóa" : "Mở khóa"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
