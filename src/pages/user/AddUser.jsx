import React, { useEffect, useState, useRef } from "react";
import {
  Form,
  Input,
  Select,
  Row,
  Col,
  message,
  DatePicker,
  Upload,
  Modal,
  Button,
} from "antd";
import { UploadOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { addNhanVien, fetchNhanVien } from "@/services/nhanVienService";
import { fetchAllChucVu } from "@/services/chucVuService";
import { useNavigate } from "react-router";
import UploadAvartar from "../../components/UploadAvartar";
import dayjs from "dayjs";
import axios from "axios";
import * as XLSX from "xlsx";

const { Option } = Select;

export default function AddUser() {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [imageUrl, setImageUrl] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [pendingValues, setPendingValues] = useState(null);
  const fileInputRef = useRef(null);

  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);
  const OCR_API_URL = "http://localhost:8080/api/cccd/scan";
  const API_BASE = "https://provinces.open-api.vn/api/v2";

  useEffect(() => {
    dispatch(fetchAllChucVu());
    fetchProvinces();
  }, [dispatch]);

  const fetchProvinces = async () => {
    try {
      const res = await axios.get(`${API_BASE}/p/`);
      setProvinces(res.data || []);
    } catch {
      messageApi.error("Không tải được danh sách tỉnh/thành");
    }
  };

  const handleProvinceChange = async (provinceCode) => {
    form.setFieldsValue({ ward: undefined });
    setWards([]);
    try {
      const res = await axios.get(`${API_BASE}/p/${provinceCode}?depth=2`);
      setWards(res.data.wards || []);
    } catch {
      messageApi.error("Không tải được phường/xã");
    }
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleScanCCCD = async (file) => {
    setOcrLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(OCR_API_URL, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data = response.data?.data?.[0];
      if (!data) {
        messageApi.error("Không đọc được thông tin CCCD");
        return false;
      }

      form.setFieldsValue({
        HoTen: data.name || "",
        NgaySinh: data.dob ? dayjs(data.dob, "DD/MM/YYYY") : null,
        DiaChi: data.home || data.address || "",
        GioiTinh: data.sex === "NAM" ? "Nam" : "Nữ",
      });

      messageApi.success("Quét CCCD thành công!");
    } catch (err) {
      console.error("Lỗi OCR:", err);
      messageApi.error("Lỗi khi quét CCCD!");
    } finally {
      setOcrLoading(false);
    }

    return false;
  };

  const onFinish = (values) => {
    setPendingValues(values);
    setConfirmModalVisible(true);
  };

  const handleConfirmAdd = async () => {
    setConfirmModalVisible(false);
    const values = pendingValues;

    const provinceName =
      provinces.find((p) => p.code === values.province)?.name || "";
    const wardName = wards.find((w) => w.code === values.ward)?.name || "";
    const fullAddress = `${values.DiaChi || ""}, ${wardName}, ${provinceName}`;

    const payload = {
      hoTen: values.HoTen,
      gioiTinh: values.GioiTinh === "Nam",
      sdt: values.SoDienThoai,
      diaChi: fullAddress,
      email: values.Email,
      chucVuId: values.ChucVu,
      ngaySinh: values.NgaySinh,
      hinhAnh: imageUrl,
      matKhau: values.MatKhau || "123456",
      trangThai: true,
    };

    try {
      await dispatch(addNhanVien(payload));
      messageApi.success("Thêm nhân viên thành công!");
      form.resetFields();
      dispatch(fetchNhanVien());
      setTimeout(() => navigate("/user"), 800);
    } catch {
      messageApi.error("Thêm thất bại!");
    }
  };

  

  return (
    <>
      {contextHolder}
      <div className="bg-white rounded-2xl mx-6 my-6">
        <div className="px-6 py-3">
          <p className="font-bold text-2xl text-[#E67E22]">Thêm nhân viên</p>
        </div>

        <UploadAvartar onUploaded={setImageUrl} />

        <div className="px-10 py-5">
          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Row gutter={16} wrap className="gap-10">
              <Col flex="1">
                <Form.Item
                  name="HoTen"
                  label="Tên nhân viên"
                  rules={[{ required: true, message: "Nhập tên nhân viên" }]}
                >
                  <Input placeholder="Nhập tên nhân viên" />
                </Form.Item>
              </Col>
              <Col flex="1">
                <Form.Item
                  name="SoDienThoai"
                  label="Số điện thoại"
                  rules={[{ required: true, message: "Nhập số điện thoại" }]}
                >
                  <Input placeholder="Nhập số điện thoại" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16} wrap className="gap-10">
              <Col flex="1">
                <Form.Item
                  name="NgaySinh"
                  label="Ngày sinh"
                  rules={[{ required: true, message: "Nhập ngày sinh" }]}
                >
                  <DatePicker className="w-full" placeholder="Ngày sinh" />
                </Form.Item>
              </Col>
              <Col flex="1">
                <Form.Item name="Email" label="Email">
                  <Input placeholder="Nhập email" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16} wrap className="gap-10">
              <Col flex="1">
                <Form.Item name="province" label="Tỉnh/Thành phố">
                  <Select
                    placeholder="Chọn tỉnh/thành"
                    onChange={handleProvinceChange}
                    showSearch
                    optionFilterProp="children"
                  >
                    {provinces.map((p) => (
                      <Option key={p.code} value={p.code}>
                        {p.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col flex="1">
                <Form.Item name="ward" label="Phường xã">
                  <Select
                    placeholder="Chọn phường/xã"
                    disabled={!wards.length}
                    showSearch
                    optionFilterProp="children"
                  >
                    {wards.map((w) => (
                      <Option key={w.code} value={w.code}>
                        {w.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="DiaChi" label="Số nhà, đường">
              <Input placeholder="Ví dụ: 123 Nguyễn Trãi" />
            </Form.Item>

            <Row gutter={16} wrap className="gap-10">
              <Col flex="1">
                <Form.Item name="GioiTinh" label="Giới tính">
                  <Select placeholder="Chọn giới tính">
                    <Option value="Nam">Nam</Option>
                    <Option value="Nữ">Nữ</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <div className="flex justify-end pr-3 gap-4">
              <button
                type="button"
                onClick={() => form.resetFields()}
                className="border border-[#E67E22] text-[#E67E22] rounded px-6 py-2 cursor-pointer"
              >
                Nhập lại
              </button>

              <button
                type="button"
                onClick={handleButtonClick}
                disabled={ocrLoading}
                className={`border border-[#E67E22] rounded px-6 py-2 cursor-pointer ${
                  ocrLoading
                    ? "bg-[#E67E22] text-white cursor-not-allowed"
                    : "text-[#E67E22]"
                }`}
              >
                {ocrLoading ? "Đang quét..." : "Quét CCCD"}
              </button>

              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                hidden
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) handleScanCCCD(file);
                  e.target.value = "";
                }}
              />

              <button
                type="submit"
                className="bg-[#E67E22] text-white rounded px-6 py-2 cursor-pointer"
              >
                Thêm mới
              </button>
            </div>
          </Form>
        </div>
      </div>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <ExclamationCircleOutlined style={{ color: "#faad14" }} />
            Xác nhận thêm nhân viên
          </div>
        }
        open={confirmModalVisible}
        onCancel={() => setConfirmModalVisible(false)}
        onOk={handleConfirmAdd}
        okText="Đồng ý"
        cancelText="Hủy"
        okButtonProps={{ style: { backgroundColor: "#E67E22" } }}
      >
        <p>Bạn có chắc chắn muốn thêm nhân viên này không?</p>
      </Modal>
    </>
  );
}
