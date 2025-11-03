import React, { useEffect, useState } from "react";
import { Space, Table, Tag, Modal, message, Button } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  fetchDotGiamGia,
  changeStatusDotGiamGia,
} from "@/services/dotGiamGiaService";
import {
  ToggleLeftIcon,
  ToggleRightIcon,
  PencilIcon,
  PencilLineIcon,
} from "@phosphor-icons/react";
import PromoBreadcrumb from "./PromoBreadcrumb";
import FilterPromo from "./FilterPromo";
import { ExclamationCircleFilled } from "@ant-design/icons";

// ... Các import giữ nguyên

export default function Promo() {
  const dispatch = useDispatch();
  const { data, loading } = useSelector((state) => state.dotGiamGia);
  const navigate = useNavigate();
  const [modal, contextHolder] = Modal.useModal();
  const [messageApi, messageContextHolder] = message.useMessage();

  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState(null);

  const showCustomModal = (record) => {
    setSelectedRecord(record);
    setIsModalVisible(true);
  };

  const handleConfirmChangeStatus = async () => {
    if (!selectedRecord) return;

    const now = dayjs();
    const start = dayjs(selectedRecord.ngayBatDau);
    const end = dayjs(selectedRecord.ngayKetThuc);

    // Kiểm tra trạng thái theo kiểu int
    if (selectedRecord.trangThai === 0 && start.isAfter(now, "day")) {
      messageApi.warning("Không thể kích hoạt đợt giảm giá chưa đến ngày bắt đầu");
      return;
    }
    if (selectedRecord.trangThai === 2 && end.isBefore(now, "day")) {
      messageApi.warning("Không thể kích hoạt đợt giảm giá đã kết thúc");
      return;
    }

    // Đổi trạng thái theo chu kỳ: 0->1 (mở), 1->2 (kết thúc), 2->không cho mở lại
    let newStatus = selectedRecord.trangThai;
    if (selectedRecord.trangThai === 0) newStatus = 1; // Mở đợt giảm giá
    else if (selectedRecord.trangThai === 1) newStatus = 2; // Kết thúc đợt giảm giá
    else {
      messageApi.warning("Không thể thay đổi trạng thái đợt giảm giá đã kết thúc.");
      setIsModalVisible(false);
      return;
    }

    try {
      await dispatch(
        changeStatusDotGiamGia({
          id: selectedRecord.id,
          trangThai: newStatus,
        })
      );

      messageApi.success(
        newStatus === 1
          ? "Kích hoạt đợt giảm giá thành công!"
          : "Kết thúc đợt giảm giá thành công!"
      );

      dispatch(fetchDotGiamGia());
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái:", error);
      messageApi.error("Thao tác thất bại!");
    } finally {
      setIsModalVisible(false);
      setSelectedRecord(null);
    }
  };

  useEffect(() => {
    dispatch(fetchDotGiamGia());
  }, [dispatch]);

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
            calculatedStatus = 0; // Sắp diễn ra
          } else if (
            (start.isBefore(now, "day") || start.isSame(now, "day")) &&
            (end.isAfter(now, "day") || end.isSame(now, "day"))
          ) {
            calculatedStatus = 1; // Đang diễn ra
          } else if (end.isBefore(now, "day")) {
            calculatedStatus = 2; // Đã kết thúc
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
            } else if (
              (start.isBefore(now, "day") || start.isSame(now, "day")) &&
              (end.isAfter(now, "day") || end.isSame(now, "day"))
            ) {
              newStatus = 1;
            } else if (end.isBefore(now, "day")) {
              newStatus = 2;
            }

            return dispatch(
              changeStatusDotGiamGia({ id: item.id, trangThai: newStatus })
            );
          })
        );

        dispatch(fetchDotGiamGia());
        messageApi.info(`Đã tự động cập nhật ${needUpdate.length} đợt giảm giá.`);
      } catch (err) {
        console.error("Lỗi khi tự động cập nhật trạng thái:", err);
        messageApi.error("Có lỗi khi tự động cập nhật trạng thái đợt.");
      }
    })();
  }, [data, dispatch, messageApi]);

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

      if (now < startDate) trangThaiText = "Sắp diễn ra";
      else if (now > endDate) trangThaiText = "Đã kết thúc";
      else trangThaiText = "Đang diễn ra";

      return {
        STT: index + 1,
        "Mã đợt": item.maGiamGia,
        "Tên đợt": item.tenDot,
        "Loại giảm": item.loaiGiamGia ? "Tiền mặt" : "Phần trăm",
        "Giá trị": item.loaiGiamGia
          ? `${item.giaTriGiam.toLocaleString()} VNĐ`
          : `${item.giaTriGiam}%`,
        "Ngày bắt đầu": dayjs(item.ngayBatDau).format("DD/MM/YYYY"),
        "Ngày kết thúc": dayjs(item.ngayKetThuc).format("DD/MM/YYYY"),
        "Trạng thái": trangThaiText,
      };
    });

    // Xuất file excel giữ nguyên
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DotGiamGia");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `Danh_sach_dot_giam_gia_${dayjs().format("DDMMYYYY")}.xlsx`);
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
    {
      title: "MÃ ĐỢT GIẢM GIÁ",
      dataIndex: "maGiamGia",
      key: "maGiamGia",
      align: "center",
    },
    { title: "TÊN ĐỢT", dataIndex: "tenDot", key: "tenDot", align: "left" },
    {
      title: "LOẠI GIẢM",
      dataIndex: "loaiGiamGia",
      key: "loaiGiamGia",
      align: "center",
      render: (v) => (v ? "Tiền mặt" : "Phần trăm"),
    },
    {
      title: "GIÁ TRỊ GIẢM",
      dataIndex: "giaTriGiam",
      key: "giaTriGiam",
      align: "center",
      render: (v, record) => {
        const formattedGiaTri = record.loaiGiamGia
          ? `${v.toLocaleString()} ₫`
          : `${v}%`;
        const formattedToiThieu = record.giaTriToiThieu
          ? `${record.giaTriToiThieu.toLocaleString()} ₫`
          : "0 ₫";

        return (
          <div>
            <div>{formattedGiaTri}</div>
            <div style={{ fontSize: 12, color: "#999" }}>
              Số tiền giảm: {formattedToiThieu}
            </div>
          </div>
        );
      },
    },
    {
      title: "NGÀY BẮT ĐẦU",
      dataIndex: "ngayBatDau",
      key: "ngayBatDau",
      align: "center",
      render: (date) => (date ? dayjs(date).format("DD/MM/YYYY") : ""),
    },
    {
      title: "NGÀY KẾT THÚC",
      dataIndex: "ngayKetThuc",
      key: "ngayKetThuc",
      align: "center",
      render: (date) => (date ? dayjs(date).format("DD/MM/YYYY") : ""),
    },
    {
      title: "TRẠNG THÁI",
      dataIndex: "trangThai",
      key: "trangThai",
      align: "center",
      render: (_, record) => {
        let status = "";
        let color = "";

        if (record.trangThai === 0) {
          status = "Sắp diễn ra";
          color = "#FFA500";
        } else if (record.trangThai === 1) {
          status = "Đang diễn ra";
          color = "#00A96C";
        } else if (record.trangThai === 2) {
          status = "Đã kết thúc";
          color = "#E74C3C";
        } else {
          status = "Không xác định";
          color = "#999";
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
          {record.trangThai === 1 && (
            <a onClick={() => showCustomModal(record)}>
              <ToggleRightIcon weight="fill" size={30} color="#00A96C" />
            </a>
          )}
          <a
            onClick={() => {
              if (record.trangThai !== 1) {
                messageApi.warning("Chỉ có thể chỉnh sửa đợt giảm giá đang diễn ra!");
                return;
              }
              navigate("/admin/update-promo", {
                state: { dotGiamGia: record },
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
    },
  ];

  return (
    <>
      {contextHolder}
      {messageContextHolder}
      <div className="p-6 flex flex-col gap-10">
        <div className="bg-white flex flex-col gap-3 px-4 py-[20px] rounded-lg shadow overflow-hidden">
          <div className="font-bold text-4xl text-[#E67E22]">
            Quản lý đợt giảm giá
          </div>
          <PromoBreadcrumb />
        </div>

        <FilterPromo handleExportExcel={handleExportExcel} />

        <div className="bg-white min-h-[500px] rounded-lg shadow overflow-hidden">
          <div className="flex justify-between items-center bg-[#E67E22] px-6 py-3 rounded-tl-lg rounded-tr-lg">
            <div className="text-white font-bold text-2xl">Danh sách đợt giảm</div>
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
            {selectedRecord?.trangThai === 1
              ? "Xác nhận kết thúc đợt giảm giá"
              : "Xác nhận mở đợt giảm giá"}
          </h2>
          <p className="text-gray-600 text-center">
            Bạn có chắc muốn{" "}
            <span className="font-semibold">
              {selectedRecord?.trangThai === 1 ? "Kết thúc đợt giảm giá" : "Mở đợt giảm giá"}
            </span>{" "}
            "<strong>{selectedRecord?.tenDot}</strong>" không?
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
              {selectedRecord?.trangThai === 1 ? "Kết thúc" : "Mở"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

