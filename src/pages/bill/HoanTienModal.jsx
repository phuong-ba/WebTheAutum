import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Space,
  Button,
  message,
  Row,
  Col,
  Typography,
  Divider,
  Table,
  Tag,
  Card,
  Statistic,
  Alert,
} from "antd";
import {
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  HistoryOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import hoaDonApi from "../../api/HoaDonAPI";
import dayjs from "dayjs";

const { Text, Title } = Typography;
const { TextArea } = Input;

const HoanTienModal = ({ visible, onCancel, onSuccess, hoaDonId }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [kiemTraLoading, setKiemTraLoading] = useState(false);
  const [lyDoMau, setLyDoMau] = useState([]);
  const [dieuKien, setDieuKien] = useState(null);
  const [lichSuHoanTien, setLichSuHoanTien] = useState([]);
  const [showLichSu, setShowLichSu] = useState(false);
  const [nhanVienId, setNhanVienId] = useState(
    localStorage.getItem("userId") || 1
  );

  // Load lý do mẫu
  useEffect(() => {
    if (visible) {
      loadLyDoMau();
      loadLichSuHoanTien();
    }
  }, [visible, hoaDonId]);

  // Kiểm tra điều kiện khi mở modal
  useEffect(() => {
    if (visible && hoaDonId) {
      kiemTraDieuKienHoanTien();
    }
  }, [visible, hoaDonId]);

  const loadLyDoMau = async () => {
    try {
      const response = await hoaDonApi.getLyDoHoanTienMau();
      setLyDoMau(response.data.data || []);
    } catch (error) {
      console.error("Lỗi tải lý do mẫu:", error);
      message.error("Không thể tải danh sách lý do mẫu");
    }
  };

  const loadLichSuHoanTien = async () => {
    try {
      const response = await hoaDonApi.getLichSuHoanTien(hoaDonId);
      setLichSuHoanTien(response.data.lichSuHoanTien || []);
    } catch (error) {
      console.error("Lỗi tải lịch sử hoàn tiền:", error);
    }
  };

  const kiemTraDieuKienHoanTien = async () => {
    try {
      setKiemTraLoading(true);
      const response = await hoaDonApi.kiemTraHoanTien(hoaDonId);

      if (response.data.success) {
        setDieuKien(response.data);

        // Set giá trị mặc định cho form
        if (response.data.coTheHoanTien && response.data.hoaDon) {
          form.setFieldsValue({
            lyDoHoanTien: null,
            soTienHoan: response.data.soTienCoTheHoan,
            ghiChuBoSung: "",
            idNhanVienThucHien: parseInt(nhanVienId),
          });
        }
      } else {
        message.error(
          response.data.message || "Không thể kiểm tra điều kiện hoàn tiền"
        );
      }
    } catch (error) {
      console.error("Lỗi kiểm tra điều kiện:", error);
      message.error("Lỗi khi kiểm tra điều kiện hoàn tiền");
    } finally {
      setKiemTraLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      const requestData = {
        lyDoHoanTien: values.lyDoHoanTien,
        soTienHoan: values.soTienHoan,
        ghiChuBoSung: values.ghiChuBoSung,
        idNhanVienThucHien: parseInt(values.idNhanVienThucHien),
      };

      const response = await hoaDonApi.hoanTienHoaDon(hoaDonId, requestData);

      if (response.data.success) {
        message.success(response.data.message || "Hoàn tiền thành công!");

        // Reset form
        form.resetFields();

        // Gọi callback thành công
        if (onSuccess) {
          onSuccess(response.data);
        }

        // Đóng modal
        onCancel();
      } else {
        message.error(response.data.message || "Hoàn tiền thất bại!");
      }
    } catch (error) {
      console.error("Lỗi hoàn tiền:", error);
      message.error(
        error.response?.data?.message || "Lỗi khi thực hiện hoàn tiền"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setDieuKien(null);
    setShowLichSu(false);
    onCancel();
  };

  const formatMoney = (amount) => {
    if (!amount && amount !== 0) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return dayjs(dateString).format("DD/MM/YYYY HH:mm:ss");
  };

  const columnsLichSu = [
    {
      title: "STT",
      key: "stt",
      width: 60,
      align: "center",
      render: (_, record, index) => index + 1,
    },
    {
      title: "Ngày hoàn tiền",
      dataIndex: "ngayThanhToan",
      key: "ngayThanhToan",
      render: (date) => formatDate(date),
    },
    {
      title: "Số tiền",
      dataIndex: "soTien",
      key: "soTien",
      align: "right",
      render: (amount) => (
        <Text strong style={{ color: "#ff4d4f" }}>
          {formatMoney(amount)}
        </Text>
      ),
    },
    {
      title: "Lý do",
      dataIndex: "lyDo",
      key: "lyDo",
      render: (lyDo, record) =>
        lyDo ||
        record.ghiChu?.replace("[HOÀN TIỀN] ", "")?.split(" - ")[0] ||
        "—",
    },
    {
      title: "Phương thức",
      dataIndex: ["phuongThucThanhToan", "ten"],
      key: "phuongThuc",
      render: (ten, record) =>
        ten || record.phuongThucThanhToan?.tenPhuongThucThanhToan || "—",
    },
    {
      title: "Trạng thái",
      dataIndex: "trangThai",
      key: "trangThai",
      align: "center",
      render: (status) => (
        <Tag color={status ? "success" : "default"}>
          {status ? "Thành công" : "Đang xử lý"}
        </Tag>
      ),
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <ExclamationCircleOutlined style={{ color: "#faad14" }} />
          <span style={{ fontSize: "18px", fontWeight: "bold" }}>
            Hoàn Tiền Hóa Đơn
          </span>
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      width={800}
      footer={null}
      centered
    >
      {!dieuKien ? (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <ReloadOutlined
            spin
            style={{ fontSize: "40px", color: "#1890ff", marginBottom: "20px" }}
          />
          <Text type="secondary">Đang kiểm tra điều kiện hoàn tiền...</Text>
        </div>
      ) : !dieuKien.coTheHoanTien ? (
        <Alert
          message="KHÔNG THỂ HOÀN TIỀN"
          description={
            <div style={{ marginTop: "10px" }}>
              <Text>{dieuKien.lyDoKhongTheHoanTien}</Text>
              {dieuKien.hoaDon && (
                <div
                  style={{
                    marginTop: "15px",
                    padding: "10px",
                    backgroundColor: "#f6ffed",
                    borderRadius: "4px",
                  }}
                >
                  <Row gutter={16}>
                    <Col span={12}>
                      <Text strong>Mã hóa đơn:</Text>
                      <div>{dieuKien.hoaDon.maHoaDon}</div>
                    </Col>
                    <Col span={12}>
                      <Text strong>Trạng thái:</Text>
                      <div>{dieuKien.hoaDon.trangThaiText}</div>
                    </Col>
                  </Row>
                  {dieuKien.soNgayTruocKhiHoanTien > 0 && (
                    <div style={{ marginTop: "10px" }}>
                      <Text strong>Thời gian từ thanh toán:</Text>
                      <div>{dieuKien.soNgayTruocKhiHoanTien} ngày</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          }
          type="error"
          showIcon
          style={{ marginBottom: "20px" }}
        />
      ) : (
        <>
          {/* Thông tin hóa đơn */}
          <Card size="small" style={{ marginBottom: "20px" }}>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="Mã hóa đơn"
                  value={dieuKien.hoaDon.maHoaDon}
                  valueStyle={{ fontSize: "16px", fontWeight: "bold" }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Tổng tiền"
                  value={formatMoney(dieuKien.hoaDon.tongTienSauGiam)}
                  valueStyle={{
                    color: "#ff4d4f",
                    fontSize: "16px",
                    fontWeight: "bold",
                  }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Trạng thái"
                  value={dieuKien.hoaDon.trangThaiText}
                  valueStyle={{ color: "#52c41a", fontSize: "16px" }}
                />
              </Col>
            </Row>
            {dieuKien.thoiGianConLai !== undefined && (
              <Alert
                message={`Thời gian còn lại để hoàn tiền: ${dieuKien.thoiGianConLai} ngày`}
                type="info"
                showIcon
                style={{ marginTop: "10px" }}
              />
            )}
          </Card>

          {/* Lịch sử hoàn tiền (nếu có) */}
          {lichSuHoanTien.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <Button
                type="link"
                icon={<HistoryOutlined />}
                onClick={() => setShowLichSu(!showLichSu)}
              >
                {showLichSu
                  ? "Ẩn lịch sử hoàn tiền"
                  : `Xem lịch sử hoàn tiền (${lichSuHoanTien.length})`}
              </Button>
              {showLichSu && (
                <Table
                  columns={columnsLichSu}
                  dataSource={lichSuHoanTien}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  style={{ marginTop: "10px" }}
                />
              )}
            </div>
          )}

          {/* Form hoàn tiền */}
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              label="Lý do hoàn tiền"
              name="lyDoHoanTien"
              rules={[
                { required: true, message: "Vui lòng chọn lý do hoàn tiền!" },
              ]}
            >
              <Select
                placeholder="Chọn lý do hoàn tiền"
                showSearch
                optionFilterProp="children"
                options={lyDoMau.map((item) => ({
                  value: item.ten,
                  label: (
                    <div>
                      <div>{item.ten}</div>
                      <div style={{ fontSize: "12px", color: "#666" }}>
                        {item.moTa}
                      </div>
                    </div>
                  ),
                }))}
              />
            </Form.Item>

            <Form.Item
              label="Số tiền hoàn"
              name="soTienHoan"
              rules={[
                { required: true, message: "Vui lòng nhập số tiền hoàn!" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || value <= 0) {
                      return Promise.reject(
                        new Error("Số tiền phải lớn hơn 0!")
                      );
                    }
                    if (value > dieuKien.soTienCoTheHoan) {
                      return Promise.reject(
                        new Error(
                          `Không thể hoàn quá ${formatMoney(
                            dieuKien.soTienCoTheHoan
                          )}!`
                        )
                      );
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={1}
                max={dieuKien.soTienCoTheHoan}
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                addonAfter="VND"
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <div
                  style={{
                    padding: "8px",
                    backgroundColor: "#f6ffed",
                    borderRadius: "4px",
                  }}
                >
                  <Text type="secondary">Số tiền có thể hoàn:</Text>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: "bold",
                      color: "#52c41a",
                    }}
                  >
                    {formatMoney(dieuKien.soTienCoTheHoan)}
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Nhân viên thực hiện"
                  name="idNhanVienThucHien"
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng nhập nhân viên thực hiện!",
                    },
                  ]}
                >
                  <InputNumber
                    style={{ width: "100%" }}
                    min={1}
                    placeholder="Mã nhân viên"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Ghi chú bổ sung" name="ghiChuBoSung">
              <TextArea
                rows={3}
                placeholder="Nhập ghi chú bổ sung (nếu có)..."
                maxLength={500}
                showCount
              />
            </Form.Item>

            <Form.Item>
              <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                <Button onClick={handleCancel}>
                  <CloseCircleOutlined /> Hủy
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<CheckCircleOutlined />}
                >
                  Xác nhận hoàn tiền
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </>
      )}
    </Modal>
  );
};

export default HoanTienModal;
