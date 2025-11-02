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

export default function Promo() {
  const dispatch = useDispatch();
  const { data, loading } = useSelector((state) => state.dotGiamGia);
  const navigate = useNavigate();
  const [modal, contextHolder] = Modal.useModal();
  const [messageApi, messageContextHolder] = message.useMessage();

  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState(null);
  console.log("🚀 ~ Promo ~ selectedRecord:", selectedRecord);

  const showCustomModal = (record) => {
    setSelectedRecord(record);
    setIsModalVisible(true);
  };
  const handleConfirmChangeStatus = async () => {
    if (!selectedRecord) return;

    const now = dayjs();
    const start = dayjs(selectedRecord.ngayBatDau);
    const end = dayjs(selectedRecord.ngayKetThuc);

    // Kiểm tra điều kiện hợp lệ
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
          if (item.trangThai === true && end.isBefore(now, "day")) return true;
          if (item.trangThai === true && start.isAfter(now, "day")) return true;
          return false;
        });

        if (needUpdate.length === 0) return;

        await Promise.all(
          needUpdate.map((item) =>
            dispatch(changeStatusDotGiamGia({ id: item.id, trangThai: false }))
          )
        );

        dispatch(fetchDotGiamGia());
        messageApi.info(
          `Đã tự động cập nhật ${needUpdate.length} đợt giảm giá.`
        );
      } catch (err) {
        console.error("Lỗi khi tự động cập nhật trạng thái:", err);
        messageApi.error("Có lỗi khi tự động cập nhật trạng thái đợt.");
      }
    })();
  }, [data, dispatch, messageApi]);

  // const handleChangeStatus = (record) => {
  //   const now = dayjs();
  //   const start = dayjs(record.ngayBatDau);
  //   const end = dayjs(record.ngayKetThuc);
  //   let canChange = true;
  //   let msg = "";

  //   if (!record.trangThai && end.isBefore(now, "day")) {
  //     canChange = false;
  //     msg = "Không thể kích hoạt đợt đã hết hạn.";
  //   } else if (start.isAfter(now, "day")) {
  //     canChange = false;
  //     msg = "Không thể thay đổi trạng thái đợt chưa đến ngày bắt đầu.";
  //   }

  //   if (!canChange) {
  //     messageApi.warning(msg);
  //     return;
  //   }

  //   const action = record.trangThai ? "Kết thúc" : "Kích hoạt";
  //   const newStatus = !record.trangThai;
  //   modal.confirm({
  //     title: `Xác nhận ${action}`,
  //     content: `Bạn có chắc muốn ${action} đợt "${record.tenDot}" không?`,
  //     okText: action,
  //     cancelText: "Hủy",
  //     okButtonProps: { danger: action === "Kết thúc" },
  //     async onOk() {
  //       try {
  //         const result = await dispatch(
  //           changeStatusDotGiamGia({ id: record.id, trangThai: newStatus })
  //         );
  //         if (changeStatusDotGiamGia.fulfilled.match(result)) {
  //           messageApi.success(`Đã ${action} đợt giảm giá thành công!`);
  //           dispatch(fetchDotGiamGia());
  //         } else {
  //           throw new Error(result.payload || "Cập nhật trạng thái thất bại");
  //         }
  //       } catch (err) {
  //         console.error("Lỗi khi cập nhật trạng thái:", err);
  //         messageApi.error(err?.message || "Cập nhật trạng thái thất bại");
  //       }
  //     },
  //   });
  // };

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
        const now = dayjs();
        const start = dayjs(record.ngayBatDau);
        const end = dayjs(record.ngayKetThuc);

        let status = "";
        let color = "";

        if (end.isBefore(now, "day")) {
          status = "Đã kết thúc";
          color = "#E74C3C";
        } else if (start.isAfter(now, "day")) {
          status = "Sắp diễn ra";
          color = "#FFA500";
        } else {
          status = record.trangThai ? "Đang diễn ra" : "Đã kết thúc";
          color = record.trangThai ? "#00A96C" : "#E74C3C";
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
          {record.trangThai && (
            <a onClick={() => showCustomModal(record)}>
              <ToggleRightIcon weight="fill" size={30} color="#00A96C" />
            </a>
          )}
          <a
            onClick={() => {
              if (!record.trangThai) {
                messageApi.warning("Không thể chỉnh sửa đợt giảm giá!");
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
              color={record.trangThai ? "#E67E22" : "#ccc"}
              style={{
                cursor: record.trangThai ? "pointer" : "not-allowed",
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
            <div className="text-white font-bold text-2xl">
              Danh sách đợt giảm
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
