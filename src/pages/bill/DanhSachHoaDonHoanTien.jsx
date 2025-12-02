import React, { useState, useEffect } from "react";
import {
  Table,
  Card,
  Row,
  Col,
  Button,
  Space,
  DatePicker,
  Input,
  Form,
  Tag,
  Typography,
  message,
  Modal,
  Tooltip,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  FileExcelOutlined,
  EyeOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import hoaDonApi from "../../api/HoaDonAPI";
import HoanTienModal from "../../components/HoanTienModal";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const DanhSachHoaDonHoanTien = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [hoanTienModalVisible, setHoanTienModalVisible] = useState(false);
  const [selectedHoaDonId, setSelectedHoaDonId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (params = {}) => {
    try {
      setLoading(true);
      const response = await hoaDonApi.getHoaDonCoTheHoanTien(
        (params.current || pagination.current) - 1,
        params.pageSize || pagination.pageSize
      );

      if (response.data.success) {
        setData(response.data.data || []);
        setPagination({
          ...pagination,
          total: response.data.totalElements || 0,
          current: response.data.currentPage + 1 || 1,
        });
      }
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
      message.error("Không thể tải danh sách hóa đơn");
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (newPagination) => {
    fetchData({
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
  };

  const handleSearch = (values) => {
    // Implement search logic here
    fetchData({
      current: 1,
      ...values,
    });
  };

  const handleReset = () => {
    form.resetFields();
    fetchData({ current: 1 });
  };

  const handleViewDetail = (id) => {
    navigate(`/hoa-don/${id}`);
  };

  const handleHoanTien = (id) => {
    setSelectedHoaDonId(id);
    setHoanTienModalVisible(true);
  };

  const handleExportExcel = async () => {
    try {
      const values = form.getFieldsValue();
      const [tuNgay, denNgay] = values.dateRange || [null, null];

      const blob = await hoaDonApi.exportBaoCaoHoanTien(tuNgay, denNgay);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `BaoCaoHoanTien_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      message.success("Đã xuất báo cáo thành công!");
    } catch (error) {
      console.error("Lỗi xuất báo cáo:", error);
      message.error("Không thể xuất báo cáo");
    }
  };

  const formatMoney = (amount) => {
    if (!amount && amount !== 0) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const columns = [
    {
      title: "STT",
      key: "stt",
      width: 60,
      align: "center",
      render: (_, record, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: "Mã hóa đơn",
      dataIndex: "maHoaDon",
      key: "maHoaDon",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Khách hàng",
      key: "khachHang",
      render: (_, record) => record.khachHang?.hoTen || "Khách lẻ",
    },
    {
      title: "Số điện thoại",
      key: "sdt",
      render: (_, record) => record.khachHang?.sdt || "—",
    },
    {
      title: "Ngày tạo",
      dataIndex: "ngayTao",
      key: "ngayTao",
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Ngày thanh toán",
      dataIndex: "ngayThanhToan",
      key: "ngayThanhToan",
      render: (date) => (date ? dayjs(date).format("DD/MM/YYYY") : "—"),
    },
    {
      title: "Tổng tiền",
      dataIndex: "tongTienSauGiam",
      key: "tongTienSauGiam",
      align: "right",
      render: (amount) => (
        <Text strong style={{ color: "#ff4d4f" }}>
          {formatMoney(amount)}
        </Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "trangThai",
      key: "trangThai",
      align: "center",
      render: (status) => (
        <Tag color="red" style={{ fontWeight: "bold" }}>
          Đã hủy
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 180,
      align: "center",
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record.id)}
            />
          </Tooltip>
          <Tooltip title="Hoàn tiền">
            <Button
              type="primary"
              icon={<DollarOutlined />}
              onClick={() => handleHoanTien(record.id)}
              style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Card>
        <Title level={3} style={{ marginBottom: "24px" }}>
          <DollarOutlined /> Danh sách hóa đơn cần hoàn tiền
        </Title>

        {/* Search Form */}
        <Form
          form={form}
          layout="inline"
          onFinish={handleSearch}
          style={{ marginBottom: "24px" }}
        >
          <Form.Item name="dateRange" label="Thời gian">
            <RangePicker format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item name="searchText" label="Tìm kiếm">
            <Input
              placeholder="Mã hóa đơn, tên khách hàng..."
              allowClear
              prefix={<SearchOutlined />}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SearchOutlined />}
              >
                Tìm kiếm
              </Button>
              <Button onClick={handleReset} icon={<ReloadOutlined />}>
                Làm mới
              </Button>
              <Button
                type="default"
                icon={<FileExcelOutlined />}
                onClick={handleExportExcel}
              >
                Xuất Excel
              </Button>
            </Space>
          </Form.Item>
        </Form>

        {/* Data Table */}
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Hoàn tiền Modal */}
      {selectedHoaDonId && (
        <HoanTienModal
          visible={hoanTienModalVisible}
          onCancel={() => {
            setHoanTienModalVisible(false);
            setSelectedHoaDonId(null);
          }}
          onSuccess={() => {
            setHoanTienModalVisible(false);
            setSelectedHoaDonId(null);
            fetchData(); // Refresh data
          }}
          hoaDonId={selectedHoaDonId}
        />
      )}
    </div>
  );
};

export default DanhSachHoaDonHoanTien;
