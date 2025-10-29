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
import CustomerForm from "../customer/CustomerForm";

import {
  downloadTemplate,
  importFromExcel,
  exportToExcel,
} from "/src/pages/customer/excelCustomerUtils";
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
    <div
      style={{
        padding: 30,
        background: "#fff",
        fontSize: "16px",
        lineHeight: 1.6,
      }}
    >
      {contextHolder}
      {messageContextHolder}
      {mode === "table" && (
        <>
          {/* Filter + Action */}
          <Card
            title={
              <span
                style={{ color: "#e67e22", fontSize: "30px", fontWeight: 600 }}
              >
                Quản lý khách hàng
              </span>
            }
            style={{
              marginBottom: 16,
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <Row gutter={[16, 16]}>
              <Col span={10}>
                <Input
                  placeholder="Mã, tên, email, SĐT..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  style={{ borderRadius: 8, fontSize: 15 }}
                />
              </Col>
            </Row>
            <Row
              gutter={[16, 16]}
              align="middle"
              style={{ marginTop: 14, marginBottom: 4 }}
            >
              <Col xs={24}>
                <span style={{ fontSize: 16 }}>
                  Tổng số khách hàng:{" "}
                  <b style={{ color: "#e67e22", fontSize: 17 }}>
                    {filteredData.length}
                  </b>
                </span>
              </Col>
            </Row>
            <Row
              gutter={[16, 16]}
              justify="space-between"
              align="middle"
              style={{
                marginTop: 8,
                borderTop: "1px solid #f0f0f0",
                paddingTop: 10,
              }}
            >
              <Col xs={24} md={12}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontWeight: 500, fontSize: 15 }}>
                    Trạng thái:
                  </span>
                  <Radio.Group
                    value={filterTrangThai}
                    onChange={(e) => setFilterTrangThai(e.target.value)}
                  >
                    <Radio value="all" style={{ fontSize: 15 }}>
                      Tất cả
                    </Radio>
                    <Radio value="active" style={{ fontSize: 15 }}>
                      Kích hoạt
                    </Radio>
                    <Radio value="inactive" style={{ fontSize: 15 }}>
                      Hủy kích hoạt
                    </Radio>
                  </Radio.Group>
                </div>
              </Col>
              <Col xs={24} md={12} style={{ textAlign: "right" }}>
                <Space wrap>
                  <Button
                    className="btn-orange-hover"
                    icon={<PlusOutlined />}
                    onClick={handleAdd}
                  >
                    Thêm Khách Hàng
                  </Button>
                  <Button
                    className="btn-orange-hover"
                    onClick={() => exportToExcel(customers)}
                    icon={<FileExcelOutlined />}
                  >
                    Xuất Excel
                  </Button>
                  <Button
                    className="btn-orange-hover"
                    loading={importing}
                    onClick={() =>
                      document.getElementById("importExcel").click()
                    }
                    icon={<CloudUploadOutlined />}
                  >
                    {importing ? "Đang nhập..." : "Nhập từ Excel"}
                  </Button>
                  <input
                    id="importExcel"
                    type="file"
                    accept=".xlsx, .xls"
                    style={{ display: "none" }}
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
                  <Button
                    className="btn-orange-hover"
                    onClick={() => downloadTemplate(diaChiApi)}
                    icon={<DownloadOutlined />}
                  >
                    Tải mẫu Excel
                  </Button>
                  <Button
                    className="btn-orange-hover"
                    onClick={() => {
                      setSearchKeyword("");
                      setFilterTrangThai("all");
                    }}
                  >
                    Đặt lại bộ lọc
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>

          {/* Bảng danh sách */}
          <Card
            title={
              <span
                style={{ fontSize: "18px", fontWeight: 600, color: "#e67e22" }}
              >
                Danh Sách Khách Hàng
              </span>
            }
            style={{
              borderRadius: 12,
              boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
            }}
          >
            <Table
              columns={columns}
              dataSource={filteredData}
              rowKey="id"
              loading={loading}
              pagination={{
                current: currentPage,
                pageSize,
                onChange: setCurrentPage,
                total: filteredData.length,
                showSizeChanger: false,
                position: ["bottomCenter"],
              }}
              style={{ fontSize: "16px" }}
            />
          </Card>
        </>
      )}

      {mode === "form" && (
        <CustomerForm
          customer={editCustomer}
          onCancel={() => setMode("table")}
          onSuccess={async (newCustomer) => {
            setMode("table");

            const isEdit = !!editCustomer;

            if (newCustomer) {
              message.success(
                isEdit
                  ? "Cập nhật khách hàng thành công"
                  : "Thêm khách hàng mới thành công"
              );

              await fetchCustomers();
            } else {
              await fetchCustomers();
            }
          }}
        />
      )}
    </div>
  );
}
