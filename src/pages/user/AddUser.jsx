import React, { useEffect, useState, useRef } from "react";
import {
  Form,
  Input,
  Select,
  Row,
  Col,
  message,
  DatePicker,
  Modal,
  Button,
} from "antd";
import { CameraOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { addNhanVien, fetchNhanVien } from "@/services/nhanVienService";
import { fetchAllChucVu } from "@/services/chucVuService";
import { useNavigate } from "react-router";
import UploadAvartar from "../../components/UploadAvartar";
import dayjs from "dayjs";
import axios from "axios";
import UserBreadcrumb from "./UserBreadcrumb";
import Webcam from "react-webcam";
const { Option } = Select;

export default function AddUser() {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [imageUrl, setImageUrl] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrLoadingCam, setOcrLoadingCam] = useState(false);

  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [pendingValues, setPendingValues] = useState(null);
  const fileInputRef = useRef(null);
  const [cameraVisible, setCameraVisible] = useState(false);
  const webcamRef = useRef(null);
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
  const handleCapture = async () => {
    if (!webcamRef.current) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      messageApi.error("Không thể chụp ảnh");
      return;
    }

    const res = await fetch(imageSrc);
    const blob = await res.blob();
    const file = new File([blob], "cccd_camera.jpg", { type: "image/jpeg" });

    setCameraVisible(false);
    await handleScanCCCD(file, "camera");
  };
  const handleScanCCCD = async (file, source = "file") => {
    if (source === "file") setOcrLoading(true);
    else setOcrLoadingCam(true);

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

      const addressText = data.home || data.address || "";
      let provinceCode = undefined;
      let wardCode = undefined;
      let shortAddress = addressText;

      const foundProvince = provinces.find((p) =>
        addressText.toLowerCase().includes(p.name.toLowerCase())
      );

      if (foundProvince) {
        provinceCode = foundProvince.code;
        shortAddress = shortAddress.replace(foundProvince.name, "").trim();

        const res = await axios.get(`${API_BASE}/p/${provinceCode}?depth=2`);
        const wardList = res.data.wards || [];
        setWards(wardList);

        const foundWard = wardList.find((w) =>
          addressText.toLowerCase().includes(w.name.toLowerCase())
        );

        if (foundWard) {
          wardCode = foundWard.code;
          shortAddress = shortAddress.replace(foundWard.name, "").trim();
        }
      }

      form.setFieldsValue({
        HoTen: data.name || "",
        NgaySinh: data.dob ? dayjs(data.dob, "DD/MM/YYYY") : null,
        GioiTinh: data.sex === "NAM" ? "Nam" : "Nữ",
        DiaChi: shortAddress || "",
        province: provinceCode,
        cccd: data.id,
        ward: wardCode,
      });

      messageApi.success("Quét CCCD thành công!");
    } catch (err) {
      console.error("Lỗi OCR:", err);
      messageApi.error("Lỗi khi quét CCCD!");
    } finally {
      if (source === "file") setOcrLoading(false);
      else setOcrLoadingCam(false);
    }
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
    const addressParts = [
      values.DiaChi?.trim(),
      wardName?.trim(),
      provinceName?.trim(),
    ].filter(Boolean);
    const fullAddress = addressParts.join(", ");

    const payload = {
      hoTen: values.HoTen,
      gioiTinh: values.GioiTinh === "Nam",
      sdt: values.SoDienThoai,
      diaChi: fullAddress,
      email: values.Email,
      chucVuId: values.ChucVu,
      ngaySinh: values.NgaySinh,
      cccd: values.cccd,
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
      <div className="p-6 flex flex-col gap-12">
        <div className="bg-white flex flex-col gap-3 px-4 py-[20px] rounded-lg shadow overflow-hidden">
          <div className="font-bold text-4xl text-[#E67E22]">
            Quản lý nhân viên
          </div>
          <UserBreadcrumb />
        </div>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-3">
            <div className="font-bold text-2xl text-[#E67E22]">
              Thêm nhân viên
            </div>
          </div>
          <div className="bg-white border-t border-slate-300">
            <UploadAvartar onUploaded={setImageUrl} />
            <div className="px-10 pb-5 ">
              <Form form={form} layout="vertical" onFinish={onFinish}>
                {/* ... các Form.Item như bạn có ... */}
                <Row gutter={16} wrap className="gap-10">
                  <Col flex="1">
                    <Form.Item
                      name="HoTen"
                      label="Tên nhân viên"
                      rules={[
                        { required: true, message: "Nhập tên nhân viên" },
                      ]}
                    >
                      <Input placeholder="Nhập tên nhân viên" />
                    </Form.Item>
                  </Col>
                  <Col flex="1">
                    <Form.Item
                      name="SoDienThoai"
                      label="Số điện thoại"
                      rules={[
                        { required: true, message: "Nhập số điện thoại" },
                        {
                          pattern: /^0\d{9}$/,
                          message:
                            "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0",
                        },
                        {
                          validator: async (_, value) => {
                            if (!value) return Promise.resolve();

                            try {
                              const res = await axios.get(
                                `http://localhost:8080/api/nhan-vien/check-sdt`,
                                { params: { sdt: value } }
                              );

                              const exists = res.data?.data?.exists;

                              if (exists === true) {
                                return Promise.reject(
                                  new Error(
                                    "Số điện thoại đã tồn tại trong hệ thống"
                                  )
                                );
                              }

                              return Promise.resolve();
                            } catch (error) {
                              console.error(
                                "Lỗi kiểm tra số điện thoại:",
                                error
                              );
                              return Promise.reject(
                                new Error(
                                  "Không kiểm tra được số điện thoại, thử lại sau"
                                )
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input placeholder="Nhập số điện thoại" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16} wrap className="gap-10">
                  <Col flex="1">
                    <Form.Item
                      name="cccd"
                      label="Căn cước công dân"
                      rules={[{ required: true, message: "Nhập CCCD" }]}
                    >
                      <Input placeholder="Nhập căn cước công dân" />
                    </Form.Item>
                  </Col>
                  <Col flex="1">
                    <Form.Item
                      name="Email"
                      label="Email"
                      rules={[
                        { required: true, message: "Nhập Email" },
                        {
                          validator: async (_, value) => {
                            if (!value) return Promise.resolve();

                            try {
                              const res = await axios.get(
                                `http://localhost:8080/api/nhan-vien/check-email`,
                                { params: { email: value } }
                              );

                              const exists = res.data?.data?.exists;

                              if (exists === true) {
                                return Promise.reject(
                                  new Error("Email đã tồn tại trong hệ thống")
                                );
                              }
                              return Promise.resolve();
                            } catch (error) {
                              console.error("Lỗi kiểm tra email:", error);
                              return Promise.reject(
                                new Error(
                                  "Không kiểm tra được email, thử lại sau"
                                )
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input placeholder="Nhập email" />
                    </Form.Item>
                  </Col>
                </Row>

                {/* Địa chỉ */}
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

                <Form.Item
                  name="DiaChi"
                  label="Số nhà, đường"
                  rules={[{ required: true, message: "Nhập địa chỉ" }]}
                >
                  <Input placeholder="Ví dụ: 123 Nguyễn Trãi" />
                </Form.Item>

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
                    <Form.Item
                      name="GioiTinh"
                      label="Giới tính"
                      rules={[{ required: true, message: "Chọn giới tính" }]}
                    >
                      <Select placeholder="Chọn giới tính">
                        <Option value="Nam">Nam</Option>
                        <Option value="Nữ">Nữ</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                {/* Buttons */}
                <div className="flex justify-end pr-3 gap-4">
                  <button
                    type="button"
                    onClick={() => form.resetFields()}
                    className="border border-[#E67E22] text-[#E67E22] rounded px-6 py-2 cursor-pointer"
                  >
                    Nhập lại
                  </button>

                  {/* Quét CCCD upload */}
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
                    {ocrLoading ? "Đang quét..." : "Quét CCCD (ảnh)"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCameraVisible(true)}
                    disabled={ocrLoadingCam}
                    className={`border border-[#E67E22] rounded px-6 py-2 cursor-pointer flex items-center gap-2 ${
                      ocrLoadingCam
                        ? "bg-[#E67E22] text-white cursor-not-allowed"
                        : "text-[#E67E22]"
                    }`}
                  >
                    <CameraOutlined />
                    {ocrLoadingCam ? "Đang quét..." : "Quét CCCD (camera)"}
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    hidden
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) handleScanCCCD(file, "file");
                      e.target.value = "";
                    }}
                  />

                  <button
                    type="submit"
                    className="bg-[#E67E22] text-white rounded px-6 py-2 cursor-pointer"
                    onClick={async () => {
                      try {
                        const values = await form.validateFields();
                        setPendingValues(values);
                        setConfirmModalVisible(true);
                      } catch (err) {
                        console.warn("Form chưa hợp lệ:", err);
                      }
                    }}
                  >
                    Thêm mới
                  </button>
                </div>
              </Form>
            </div>
          </div>
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
      </Modal>{" "}
      <Modal
        open={cameraVisible}
        onCancel={() => setCameraVisible(false)}
        footer={null}
        width={600}
      >
        <div className="flex flex-col items-center gap-3">
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: "environment" }}
            style={{ width: "100%", borderRadius: "8px" }}
          />
          <Button
            type="primary"
            onClick={handleCapture}
            style={{ backgroundColor: "#E67E22" }}
          >
            Chụp & Quét
          </Button>
        </div>
      </Modal>
    </>
  );
}
