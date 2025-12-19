import React, { useEffect, useState } from "react";
import { Table, Space, Tag, message, Modal, Select } from "antd";
import { ToggleLeft, ToggleRight, PencilLine } from "@phosphor-icons/react";
import { khachHangApi } from "/src/api/khachHangApi";
import { diaChiApi } from "/src/api/diaChiApi";
import {
  downloadTemplate,
  importFromExcel,
  exportToExcel,
} from "/src/pages/customer/excelCustomerUtils";
import CustomerForm from "./CustomerForm";
import ConfirmModal from "./ConfirmModal";
import CustomerBreadcrumb from "./CustomerBreadcrumb";
import {
  ExportOutlined,
  ImportOutlined,
  PlusSquareOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

export default function Customer() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("table");
  const [editCustomer, setEditCustomer] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterTrangThai, setFilterTrangThai] = useState("all");
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    type: null,
    record: null,
    loading: false,
  });
  const [messageApi, messageContextHolder] = message.useMessage();
  const pageSize = 5;
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  // 🔹 Cấu hình message
  useEffect(() => {
    message.config({ top: "45%", duration: 2, maxCount: 3 });
  }, []);

  // 🔹 Gọi API
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await khachHangApi.getAll();
      const sorted = Array.isArray(res)
        ? [...res].sort(
            (a, b) =>
              new Date(b.ngaySua || b.ngayTao) -
              new Date(a.ngaySua || a.ngayTao)
          )
        : [];
      setCustomers(sorted);
    } catch {
      message.error("Không thể tải danh sách khách hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // 🔹 Mở modal xác nhận
  const openConfirmModal = (type, record = null) => {
    if (type === "edit" && record && !record.trangThai) {
      Modal.warning({
        centered: true,
        title: "Không thể cập nhật!",
        content: (
          <>
            Khách hàng <strong>{record.hoTen}</strong> đã bị khóa và không thể
            chỉnh sửa.
          </>
        ),
        okText: "Đã hiểu",
        okButtonProps: {
          style: { backgroundColor: "#E67E22", borderColor: "#E67E22" },
        },
      });
      return;
    }

    setConfirmModal({ visible: true, type, record, loading: false });
  };

  // 🔹 Xử lý xác nhận (bản gọn, không thanh màu)
  const handleConfirm = async () => {
    const { type, record } = confirmModal;
    try {
      setConfirmModal((prev) => ({ ...prev, loading: true }));

      if (type === "add" || type === "edit") {
        setEditCustomer(type === "edit" ? record : null);
        setMode("form");
      } else if (type === "status") {
        const updated = { ...record, trangThai: !record.trangThai };
        await khachHangApi.update(record.id, updated);

        // ✅ Thông báo gọn, mặc định của Ant Design
        messageApi.success(
          record.trangThai
            ? "Khóa khách hàng thành công!"
            : "Mở khóa khách hàng thành công!"
        );

        await fetchCustomers();
      }
    } catch {
      messageApi.error("Thao tác thất bại!");
    } finally {
      setConfirmModal({
        visible: false,
        type: null,
        record: null,
        loading: false,
      });
    }
  };

  // 🔹 Lọc dữ liệu
  const filteredData = customers.filter((item) => {
    const search = searchKeyword.toLowerCase();
    const matchSearch =
      item.maKhachHang?.toLowerCase().includes(search) ||
      item.hoTen?.toLowerCase().includes(search) ||
      item.email?.toLowerCase().includes(search) ||
      item.sdt?.toLowerCase().includes(search);

    const matchStatus =
      filterTrangThai === "all"
        ? true
        : filterTrangThai === "active"
        ? item.trangThai
        : !item.trangThai;

    return matchSearch && matchStatus;
  });

  // 🔹 Cấu hình cột
  const columns = [
    {
      title: "STT",
      render: (_, __, i) => (currentPage - 1) * pageSize + i + 1,
      align: "center",
    },
    {
      title: "Mã KH",
      dataIndex: "maKhachHang",
    },
    { title: "Tên KH", dataIndex: "hoTen" },
    { title: "SĐT", dataIndex: "sdt" },
    { title: "Email", dataIndex: "email" },
    {
      title: "Địa chỉ",
      render: (r) => {
        const dc = r.diaChi?.find((a) => a.trangThai);
        return dc
          ? dc.diaChiCuThe
          : r.diaChi?.[0]?.diaChiCuThe || "Không có địa chỉ nào";
      },
    },
    {
      title: "Trạng thái",
      align: "center",
      render: (r) =>
        r.trangThai ? (
          <Tag color="#E9FBF4" style={{ border: "1px solid #00A96C" }}>
            <div className="text-[#00A96C]">Đang hoạt động</div>
          </Tag>
        ) : (
          <Tag color="red">Ngừng hoạt động</Tag>
        ),
    },
    {
      title: "Hành động",
      align: "center",
      render: (_, r) => (
        <Space>
          <div
            onClick={() => openConfirmModal("status", r)}
            style={{ cursor: "pointer" }}
          >
            {r.trangThai ? (
              <ToggleRight weight="fill" size={30} color="#00A96C" />
            ) : (
              <ToggleLeft weight="fill" size={30} color="#c5c5c5" />
            )}
          </div>

          <div
            onClick={() => openConfirmModal("edit", r)}
            style={{ cursor: "pointer" }}
          >
            <PencilLine size={24} weight="fill" color="#E67E22" />
          </div>
        </Space>
      ),
    },
  ];

  // 🔹 Hàm dựng tiêu đề & mô tả modal
  const getModalText = () => {
    const { type, record } = confirmModal;
    if (type === "add")
      return {
        title: "Xác nhận thêm khách hàng",
        desc: "Bạn có chắc muốn thêm khách hàng mới không?",
        btn: "Thêm mới",
      };
    if (type === "edit")
      return {
        title: "Xác nhận sửa khách hàng",
        desc: (
          <>
            Bạn có chắc muốn sửa khách hàng <strong>{record?.hoTen}</strong>{" "}
            không?
          </>
        ),
        btn: "Sửa",
      };
    if (type === "status")
      return {
        title: record?.trangThai
          ? "Xác nhận khóa khách hàng"
          : "Xác nhận mở khóa khách hàng",
        desc: (
          <>
            Bạn có chắc muốn{" "}
            <span className="font-semibold">
              {record?.trangThai ? "khóa" : "mở khóa"}
            </span>{" "}
            khách hàng "<strong>{record?.hoTen}</strong>" không?
          </>
        ),
        btn: record?.trangThai ? "Khóa" : "Mở khóa",
      };
  };

  const modalText = getModalText();

  return (
    <>
      {messageContextHolder}

      {mode === "table" ? (
        <div className="p-6 flex flex-col gap-10">
          {/* ==== Header ==== */}
          <div className="bg-white px-4 py-5 rounded-lg shadow">
            <div className="font-bold text-4xl text-[#E67E22]">
              Quản lý khách hàng
            </div>
            <div className="text-gray-500 text-sm">
              <CustomerBreadcrumb />
            </div>
          </div>

          {/* ==== Bộ lọc ==== */}
          <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
            <div className="bg-[#E67E22] px-6 py-3 text-white font-bold text-lg">
              Bộ lọc khách hàng
            </div>

            <div className="p-6 flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <input
                  placeholder="Nhập mã, tên, email, số điện thoại..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="border rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-[#E67E22]"
                />
                <select
                  value={filterTrangThai}
                  onChange={(e) => setFilterTrangThai(e.target.value)}
                  className="border rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-[#E67E22]"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Ngừng hoạt động</option>
                </select>
              </div>

              <div className="flex justify-end gap-4 pr-3 text-sm">
                <div
                  onClick={() => {
                    setSearchKeyword("");
                    setFilterTrangThai("all");
                  }}
                  className="border  text-white rounded-md px-6 py-2 cursor-pointer bg-gray-400 font-bold hover:bg-amber-700 active:bg-cyan-800 select-none"
                >
                  <ReloadOutlined /> Nhập lại
                </div>
                <div
                  onClick={() => openConfirmModal("add")}
                  className="bg-[#E67E22] text-white rounded-md px-6 py-2 cursor-pointer font-bold hover:bg-amber-800 hover:text-white active:bg-cyan-800 select-none"
                >
                  <PlusSquareOutlined /> Thêm mới
                </div>

                <div
                  onClick={() => exportToExcel(customers)}
                  className="bg-[#E67E22] text-white rounded-md px-6 py-2 cursor-pointer font-bold hover:bg-amber-800 hover:text-white active:bg-cyan-800 select-none"
                >
                  <ExportOutlined /> Xuất Excel
                </div>

                <div
                  onClick={downloadTemplate}
                  className="bg-[#E67E22] text-white rounded-md px-6 py-2 cursor-pointer font-bold hover:bg-amber-800 hover:text-white active:bg-cyan-800 select-none"
                >
                  <ExportOutlined /> Tải mẫu Excel
                </div>

                <input
                  type="file"
                  accept=".xlsx, .xls"
                  hidden
                  id="importExcel"
                  onChange={(e) =>
                    importFromExcel(
                      e.target.files[0],
                      khachHangApi,
                      diaChiApi,
                      fetchCustomers
                    )
                  }
                />

                <div
                  onClick={() =>
                    document.getElementById("importExcel")?.click()
                  }
                  className="bg-[#E67E22] text-white rounded-md px-6 py-2 font-bold cursor-pointer hover:bg-amber-800"
                >
                  <ImportOutlined /> Thêm từ Excel
                </div>
              </div>
            </div>
          </div>

          {/* ==== Danh sách ==== */}
          <div className="bg-white rounded-lg shadow">
            <div className="flex justify-between items-center bg-[#E67E22] px-6 py-3 rounded-t-lg">
              <div className="text-white font-bold text-2xl">
                Danh sách khách hàng
              </div>
            </div>

            <Table
              columns={columns}
              dataSource={filteredData}
              rowKey="id"
              loading={loading}
              bordered
              pagination={{
                current: currentPage,
                pageSize,
                onChange: setCurrentPage,
                total: filteredData.length,
                position: ["bottomRight"],
              }}
            />
          </div>
        </div>
      ) : (
        <CustomerForm
          customer={editCustomer}
          onCancel={() => setMode("table")}
          onSuccess={() => {
            fetchCustomers();
            setMode("table");
          }}
        />
      )}

      {/* ==== Modal xác nhận ==== */}
      <ConfirmModal
        open={confirmModal.visible}
        onCancel={() =>
          setConfirmModal({ visible: false, type: null, record: null })
        }
        onConfirm={handleConfirm}
        loading={confirmModal.loading}
        title={modalText?.title}
        description={modalText?.desc}
        confirmText={modalText?.btn}
        confirmType="primary"
        confirmDanger={
          confirmModal.type === "status" && confirmModal.record?.trangThai
        }
      />
    </>
  );
}
