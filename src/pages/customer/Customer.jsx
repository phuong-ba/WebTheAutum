import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Space,
  Tag,
  message,
  Row,
  Col,
  Input,
  Radio,
  Switch,
  Card,
  Tooltip,
  Modal,
  Select,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  FileExcelOutlined,
  CloudUploadOutlined,
  DownloadOutlined,
  LockOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import { khachHangApi } from "/src/api/khachHangApi";
import { diaChiApi } from "/src/api/diaChiApi";
import CustomerBreadcrumb from "../customer/CustomerBreadcrumb";
import {
  downloadTemplate,
  importFromExcel,
  exportToExcel,
} from "/src/pages/customer/excelCustomerUtils";
import CustomerForm from "./CustomerForm";
export default function Customer() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [editCustomer, setEditCustomer] = useState(null);
  const [mode, setMode] = useState("table");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterTrangThai, setFilterTrangThai] = useState("all");
  const [importing, setImporting] = useState(false);
  const [messageApi, messageContextHolder] = message.useMessage();
  const [modal, contextHolder] = Modal.useModal();
  const { Option } = Select;
  const pageSize = 5;

  // 🔹 Gọi API lấy danh sách và sắp xếp theo ngày sửa / ngày tạo giảm dần
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await khachHangApi.getAll();

      // 🔸 Ưu tiên ngày sửa nếu có, nếu không có thì dùng ngày tạo
      const sorted = Array.isArray(res)
        ? [...res].sort((a, b) => {
            const dateA = new Date(a.ngaySua || a.ngayTao);
            const dateB = new Date(b.ngaySua || b.ngayTao);
            return dateB - dateA; // giảm dần
          })
        : [res];

      setCustomers(sorted);
      return sorted;
    } catch (err) {
      message.error("Không thể tải danh sách khách hàng");
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleAdd = () => {
    setEditCustomer(null);
    setMode("form");
  };

  const handleEdit = (record) => {
    setEditCustomer(record);
    setMode("form");
  };

  // Khai báo cấu hình message để hiện ở góc phải
  message.config({
    duration: 1,
    maxCount: 3,
  });

  const toggleStatus = async (record) => {
    if (record.trangThai) {
      modal.confirm({
        title: "Xác nhận khóa",
        content: `Bạn có chắc muốn khóa khách hàng "${record.hoTen}" không?`,
        okText: "Khóa",
        cancelText: "Hủy",
        okButtonProps: { danger: true },
        onOk: async () => {
          try {
            const updatedCustomer = {
              ...record,
              trangThai: false,
            };
            await khachHangApi.update(record.id, updatedCustomer);

            messageApi.open({
              type: "success",
              content: (
                <div style={{ fontSize: "16px", fontWeight: 600 }}>
                  Đã khóa khách hàng{" "}
                  <span style={{ color: "#e57c23" }}>{record.hoTen}</span>
                </div>
              ),
              duration: 2,
              style: {
                position: "fixed",
                right: 20,
                top: 80,
                minWidth: 280,
                padding: "12px 16px",
                borderRadius: "10px",
                fontSize: "16px",
              },
            });

            fetchCustomers();
          } catch (err) {
            messageApi.open({
              type: "error",
              content: "Khóa khách hàng thất bại!",
              duration: 2,
              style: {
                position: "fixed",
                right: 20,
                top: 80,
              },
            });
          }
        },
      });
    } else {
      modal.confirm({
        title: "Xác nhận mở khóa",
        content: `Bạn có chắc muốn mở khóa khách hàng "${record.hoTen}" không?`,
        okText: "Mở khóa",
        cancelText: "Hủy",
        onOk: async () => {
          try {
            const updatedCustomer = {
              ...record,
              trangThai: true,
            };
            await khachHangApi.update(record.id, updatedCustomer);

            messageApi.open({
              type: "success",
              content: (
                <div style={{ fontSize: "16px", fontWeight: 600 }}>
                  Đã mở khóa khách hàng{" "}
                  <span style={{ color: "#e57c23" }}>{record.hoTen}</span>
                </div>
              ),
              duration: 2,
              style: {
                position: "fixed",
                right: 20,
                top: 80,
                minWidth: 280,
                padding: "12px 16px",
                borderRadius: "10px",
                fontSize: "16px",
              },
            });

            fetchCustomers();
          } catch (err) {
            messageApi.open({
              type: "error",
              content: "Mở khóa khách hàng thất bại!",
              duration: 2,
              style: {
                position: "fixed",
                right: 20,
                top: 80,
              },
            });
          }
        },
      });
    }
  };

  // 🔹 Lọc và tìm kiếm
  const filteredData = customers.filter((item) => {
    const matchSearch =
      item.maKhachHang?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      item.hoTen?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      item.email?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      item.sdt?.toLowerCase().includes(searchKeyword.toLowerCase());

    const matchStatus =
      filterTrangThai === "all"
        ? true
        : filterTrangThai === "active"
        ? item.trangThai
        : !item.trangThai;

    return matchSearch && matchStatus;
  });

  // 🔹 Cột bảng
  const columns = [
    {
      title: "STT",
      render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
      align: "center",
    },
    {
      title: "Mã Khách Hàng",
      dataIndex: "maKhachHang",
      render: (text) => (
        <a style={{ color: "#e67e22", fontWeight: 600, fontSize: "16px" }}>
          {text}
        </a>
      ),
    },
    { title: "Tên Khách Hàng", dataIndex: "hoTen" },
    { title: "Số Điện Thoại", dataIndex: "sdt" },
    { title: "Email", dataIndex: "email" },
    {
      title: "Địa Chỉ",
      render: (r) => {
        const defaultAddress = r.diaChi?.find((a) => a.trangThai);
        return defaultAddress
          ? defaultAddress.diaChiCuThe
          : r.diaChi?.[0]?.diaChiCuThe || "Không có địa chỉ";
      },
    },
    {
      title: "Trạng Thái",
      align: "center",
      render: (r) =>
        r.trangThai ? (
          <Tag color="green" style={{ fontSize: 14, padding: "6px 14px" }}>
            Kích Hoạt
          </Tag>
        ) : (
          <Tag color="red" style={{ fontSize: 14, padding: "6px 14px" }}>
            Đã Hủy
          </Tag>
        ),
    },
    {
      title: "Hành Động",
      align: "center",
      render: (_, record) => (
        <Space size="large">
          <Tooltip title={record.trangThai ? "Đang kích hoạt" : "Đã khóa"}>
            {record.trangThai ? (
              <UnlockOutlined
                style={{
                  color: "#e57c23",
                  fontSize: 22,
                  cursor: "pointer",
                }}
                onClick={() => toggleStatus(record)}
              />
            ) : (
              <LockOutlined
                style={{
                  color: "#e90408ff",
                  fontSize: 22,
                  cursor: "pointer",
                }}
                onClick={() => toggleStatus(record)}
              />
            )}
          </Tooltip>

          <Tooltip
            title={
              record.trangThai ? "Chỉnh sửa khách hàng" : "Không thể chỉnh sửa"
            }
          >
            <Button
              type="text"
              icon={
                <EditOutlined
                  style={{
                    color: record.trangThai ? "#e67e22" : "#ccc",
                    fontSize: 20,
                  }}
                />
              }
              onClick={() => handleEdit(record)}
              disabled={!record.trangThai}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      {messageContextHolder}

      {mode === "table" ? (
        // ==== Giao diện bảng khách hàng ====
        <div className="p-6 flex flex-col gap-10">
          {/* ==== PHẦN TIÊU ĐỀ ==== */}
          <div className="bg-white flex flex-col gap-3 px-4 py-[20px] rounded-lg shadow overflow-hidden">
            <div className="font-bold text-4xl text-[#E67E22]">
              Quản lý khách hàng
            </div>
            <div className="text-gray-500 text-sm">
              <CustomerBreadcrumb />
            </div>
          </div>

          {/* ==== BỘ LỌC KHÁCH HÀNG ==== */}
          <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
            <div className="bg-[#E67E22] px-6 py-3 text-white font-bold text-lg rounded-tl-lg rounded-tr-lg">
              Bộ lọc khách hàng
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Nhập mã, tên, email, số điện thoại..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="border rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#E67E22]"
                />
                <select
                  value={filterTrangThai}
                  onChange={(e) => setFilterTrangThai(e.target.value)}
                  className="border rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#E67E22]"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Ngừng hoạt động</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => {
                    setSearchKeyword("");
                    setFilterTrangThai("all");
                  }}
                  className="bg-gray-100 text-gray-700 rounded px-6 py-2 hover:bg-gray-200 transition-colors"
                >
                  Nhập lại
                </button>

                <button className="bg-[#E67E22] text-white rounded px-6 py-2 hover:bg-[#d35400] transition-colors">
                  Tìm kiếm
                </button>
              </div>
            </div>
          </div>

          {/* ==== DANH SÁCH KHÁCH HÀNG ==== */}
          <div className="bg-white min-h-[500px] rounded-lg shadow overflow-hidden">
            <div className="flex justify-between items-center bg-[#E67E22] px-6 py-3 rounded-tl-lg rounded-tr-lg">
              <div className="text-white font-bold text-2xl">
                Danh sách khách hàng
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAdd}
                  className="bg-white text-[#E67E22] rounded px-6 py-2 cursor-pointer hover:bg-gray-100 hover:text-[#d35400] active:border-[#d35400] transition-colors font-medium"
                >
                  Thêm mới
                </button>

                <button
                  onClick={() => exportToExcel(customers)}
                  disabled={!customers || customers.length === 0}
                  className="bg-white text-[#E67E22] rounded px-6 py-2 cursor-pointer hover:bg-gray-100 hover:text-[#d35400] transition-colors font-medium"
                >
                  Xuất Excel
                </button>

                <button
                  onClick={downloadTemplate}
                  className="bg-white text-[#E67E22] rounded px-6 py-2 cursor-pointer hover:bg-gray-100 hover:text-[#d35400] transition-colors font-medium"
                >
                  Tải mẫu Excel
                </button>

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
                      fetchCustomers,
                      setImporting
                    )
                  }
                />

                <button
                  type="button"
                  onClick={() =>
                    document.getElementById("importExcel")?.click()
                  }
                  className="bg-white text-[#E67E22] rounded px-6 py-2 cursor-pointer hover:bg-gray-100 hover:text-[#d35400] transition-colors font-medium"
                >
                  Thêm từ Excel
                </button>
              </div>
            </div>

            <Table
              columns={columns}
              dataSource={filteredData}
              rowKey="id"
              bordered
              pagination={{
                current: currentPage,
                pageSize: 5,
                onChange: setCurrentPage,
                total: filteredData.length,
                position: ["bottomCenter"],
              }}
            />
          </div>
        </div>
      ) : (
        // ==== Giao diện form thêm/sửa khách hàng ====
        <CustomerForm
          customer={editCustomer}
          onCancel={() => setMode("table")}
          onSuccess={() => {
            fetchCustomers();
            setMode("table");
          }}
        />
      )}
    </>
  );
}
