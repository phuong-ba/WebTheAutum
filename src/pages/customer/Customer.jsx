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
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  FileExcelOutlined,
  CloudUploadOutlined,
  DownloadOutlined,
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

  const pageSize = 5;

  // 🔹 Gọi API lấy danh sách
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await khachHangApi.getAll();

      const sorted = Array.isArray(res)
        ? [...res].sort((a, b) => b.id - a.id)
        : [res];

      setCustomers(sorted);
    } catch {
      message.error("Không thể tải danh sách khách hàng");
    } finally {
      setLoading(false);
    }
  };

  // --
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

  // 🔹 Cấu hình cột
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
        <a style={{ color: "#00b96b", fontWeight: 600, fontSize: "16px" }}>
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
          <Switch
            checked={record.trangThai}
            onChange={() => {
              const updated = customers.map((c) =>
                c.id === record.id ? { ...c, trangThai: !c.trangThai } : c
              );
              setCustomers(updated);
            }}
            style={{ transform: "scale(1.2)" }}
          />
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

  // 🔹 JSX hiển thị
  return (
    <div
      style={{
        padding: 30,
        background: "#fff",
        fontSize: "16px",
        lineHeight: 1.6,
      }}
    >
      {mode === "table" && (
        <>
          {/* Bộ lọc */}
          <Card
            title={
              <span
                style={{
                  color: "#e67e22",
                  fontSize: "30px",
                  fontWeight: "600",
                  letterSpacing: "0.5px",
                }}
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
                  <b style={{ color: "#00b96b", fontSize: 17 }}>
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
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAdd}
                    style={{
                      background: "#00b96b",
                      borderRadius: 8,
                      fontWeight: 500,
                    }}
                  >
                    Thêm Khách Hàng
                  </Button>

                  <Button
                    onClick={() => exportToExcel(customers)}
                    icon={<FileExcelOutlined />}
                    style={{ borderRadius: 8 }}
                  >
                    Xuất Excel
                  </Button>

                  <Button
                    loading={importing}
                    onClick={() =>
                      document.getElementById("importExcel").click()
                    }
                    icon={<CloudUploadOutlined />}
                    style={{ borderRadius: 8 }}
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
                    onClick={() => downloadTemplate(diaChiApi)}
                    icon={<DownloadOutlined />}
                    style={{ borderRadius: 8 }}
                  >
                    Tải mẫu Excel
                  </Button>

                  <Button
                    onClick={() => {
                      setSearchKeyword("");
                      setFilterTrangThai("all");
                    }}
                    style={{ background: "#f5f5f5", borderRadius: 8 }}
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
              <span style={{ fontSize: "18px", fontWeight: 600 }}>
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
          onSuccess={(newCustomer) => {
            setMode("table");
            fetchCustomers();
          }}
        />
      )}
    </div>
  );
}
