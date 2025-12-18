import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Select,
  Row,
  Col,
  message,
  DatePicker,
  Spin,
  Modal,
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllChucVu } from "@/services/chucVuService";
import dayjs from "dayjs";
import { useNavigate, useParams } from "react-router";
import UploadAvartar from "../../components/UploadAvartar";
import UserBreadcrumb from "./OriginBreadcrumb";
import axios from "axios";
import { nhanVienById, updateNhanVien } from "@/services/nhanVienService";
import { ExclamationCircleFilled } from "@ant-design/icons";

const { Option } = Select;

export default function UpdateColor() {
  const dispatch = useDispatch();
  const { data } = useSelector((state) => state.chucvu);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [imageUrl, setImageUrl] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const { id } = useParams();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [provinces, setProvinces] = useState([]);

  const [wards, setWards] = useState([]);
  const API_BASE = "https://provinces.open-api.vn/api/v2";

  useEffect(() => {
    dispatch(fetchAllChucVu());
    fetchProvinces();
  }, [dispatch]);

  useEffect(() => {
    if (provinces.length > 0 && id) {
      fetchUserData();
    }
  }, [provinces, id]);

  const fetchProvinces = async () => {
    try {
      const res = await axios.get(`${API_BASE}/p/`);
      setProvinces(res.data || []);
    } catch {
      messageApi.error("Không tải được danh sách tỉnh/thành");
    }
  };
  useEffect(() => {
    if (id) {
      fetchUserData();
    }
  }, [id]);

  const fetchUserData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const user = await dispatch(nhanVienById(Number(id))).unwrap();
      console.log("🚀 ~ fetchUserData ~ user:", user);
      const userInfo = user.data;
      console.log(userInfo);
      setUserData(userInfo);

      let provinceCode = undefined;
      let wardCode = undefined;
      let shortAddress = userInfo.diaChi || "";

      if (userInfo.diaChi) {
        const parts = userInfo.diaChi.split(",").map((p) => p.trim());
        const cityName = parts[parts.length - 1];
        const wardName = parts[parts.length - 2];

        const foundProvince = provinces.find(
          (p) => p.name.toLowerCase() === cityName?.toLowerCase()
        );
        if (foundProvince) {
          provinceCode = foundProvince.code;
          const res = await axios.get(`${API_BASE}/p/${provinceCode}?depth=2`);
          const wardList = res.data.wards || [];
          setWards(wardList);

          // Tìm code phường/xã
          const foundWard = wardList.find(
            (w) => w.name.toLowerCase() === wardName?.toLowerCase()
          );
          if (foundWard) wardCode = foundWard.code;

          shortAddress = shortAddress
            .replace(wardName, "")
            .replace(cityName, "")
            .split(",")
            .map((part) => part.trim())
            .filter(Boolean)
            .join(", ");
        }
      }

      form.setFieldsValue({
        maNhanVien: userInfo.maNhanVien,
        tenNhanVien: userInfo.hoTen,
        gioiTinh: userInfo.gioiTinh ? "Nam" : "Nữ",
        soDienThoai: userInfo.sdt,
        cccd: userInfo.cccd,
        diaChi: shortAddress,
        email: userInfo.email,
        chucVu: userInfo.chucVuId,
        ngaySinh: userInfo.ngaySinh ? dayjs(userInfo.ngaySinh) : null,
        province: provinceCode,
        ward: wardCode,
        hinhAnh: userInfo.hinhAnh,
      });

      setImageUrl(userInfo.hinhAnh || null);
    } catch (error) {
      messageApi.error("Không tải được dữ liệu nhân viên");
    } finally {
      setLoading(false);
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

  const onFinish = async (values) => {
    try {
      const payload = {
        maNhanVien: userData.maNhanVien,
        hoTen: values.tenNhanVien,
        gioiTinh: values.gioiTinh === "Nam",
        sdt: values.soDienThoai,
        diaChi: values.diaChi,
        cccd: values.cccd ?? userData.cccd,
        email: values.email ?? userData.email,
        chucVuId: values.chucVu,
        ngaySinh: values.ngaySinh?.toISOString(),
        trangThai: true,
        matKhau: userData.matKhau,
        hinhAnh: imageUrl ?? userData.hinhAnh,
      };

      await dispatch(updateNhanVien({ id: userData.id, nhanvien: payload }));
      setTimeout(() => navigate("/admin/user"), 800);
      messageApi.success("Cập nhật nhân viên thành công!");
    } catch (error) {
      messageApi.error("Cập nhật thất bại! Vui lòng thử lại.");
    }
  };
  const handleConfirmUpdate = async () => {
    try {
      const values = await form.validateFields();
      await onFinish(values);
      setConfirmModalVisible(false);
    } catch (error) {
      messageApi.error("Vui lòng kiểm tra lại thông tin!");
    }
  };
  if (loading) return <Spin className="mt-10" size="large" />;

  return (
    <>
      {contextHolder}
      <div className="p-6 flex flex-col gap-12">
        <div className="bg-white flex flex-col gap-3 px-4 py-[20px] rounded-lg shadow overflow-hidden">
          <div className="font-bold text-4xl text-[#E67E22]">
            Quản lý nhân viên
          </div>
          <UserBreadcrumb />
        </div>{" "}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-3">
            <div className="font-bold text-2xl text-[#E67E22]">
              Cập nhật thông tin nhân viên
            </div>
          </div>

          <div className="bg-white border-t border-slate-300">
            <UploadAvartar imageUrl={imageUrl} onUploaded={setImageUrl} />

            <div className="px-10 py-5">
              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                autoComplete="off"
              >
                <Row gutter={16} wrap className="gap-10">
                  <Col flex="1">
                    <Form.Item
                      name="tenNhanVien"
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
                      name="soDienThoai"
                      label="Số điện thoại"
                      rules={[
                        { required: true, message: "Nhập số điện thoại" },
                      ]}
                    >
                      <Input placeholder="Nhập số điện thoại" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16} wrap className="gap-10">
                  <Col flex="1">
                    <Form.Item
                      name="ngaySinh"
                      label="Ngày sinh"
                      rules={[{ required: true, message: "Chọn ngày sinh" }]}
                    >
                      <DatePicker className="w-full" placeholder="Ngày sinh" />
                    </Form.Item>
                  </Col>
                  <Col flex="1">
                    <Form.Item
                      name="cccd"
                      label="Căn cước công dân"
                      rules={[{ required: true, message: "Nhập CCCD" }]}
                    >
                      <Input placeholder="Nhập căn cước công dân" />
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
                <Row gutter={16} wrap className="gap-10">
                  <Col flex="1">
                    <Form.Item name="diaChi" label="Địa chỉ">
                      <Input placeholder="Nhập địa chỉ" />
                    </Form.Item>
                  </Col>
                  <Col flex="1">
                    <Form.Item name="gioiTinh" label="Giới tính">
                      <Select placeholder="Chọn giới tính">
                        <Option value="Nam">Nam</Option>
                        <Option value="Nữ">Nữ</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16} wrap className="gap-10 ">
                  <Col flex="1">
                    <Form.Item name="chucVu" label="Chức vụ">
                      <Select placeholder="Chọn chức vụ">
                        {data?.map((cv) => (
                          <Option key={cv.id} value={cv.id}>
                            {cv.tenChucVu}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col flex="1"></Col>
                </Row>

                <div className="flex justify-end pr-3 gap-4">
                  <div
                    onClick={() => navigate("/admin/user")}
                    className="border  text-white rounded-md px-6 py-2 cursor-pointer bg-gray-400 font-bold hover:bg-amber-700 active:bg-cyan-800 select-none"
                  >
                    Hủy
                  </div>

                  <div
                    onClick={() => setConfirmModalVisible(true)}
                    className="bg-[#E67E22] text-white rounded-md px-6 py-2 cursor-pointer font-bold 
  hover:bg-amber-700 active:bg-cyan-800 select-none transition-all duration-200 shadow-md 
  hover:shadow-lg active:shadow-xl active:scale-95"
                  >
                    Cập nhật
                  </div>
                </div>
              </Form>
            </div>
          </div>
        </div>
      </div>
      <Modal
        open={confirmModalVisible}
        onCancel={() => setConfirmModalVisible(false)}
        footer={null}
        width={450}
        centered
        closable={false}
      >
        <div className="flex flex-col items-center gap-4 p-4">
          <div className="text-2xl font-bold mb-2 text-[#E67E22]">
            Xác nhận cập nhật nhân viên
          </div>
          <ExclamationCircleFilled style={{ fontSize: 64, color: "#faad14" }} />
          <div className="text-gray-600 mb-4 text-center">
            Bạn có chắc chắn muốn{" "}
            <strong className="text-[#E67E22]">cập nhật</strong> thông tin nhân
            viên này không?
          </div>

          <div className="flex justify-center gap-6  w-full">
            <div
              className="w-40 cursor-pointer select-none  text-center py-3 rounded-xl bg-[#b8b8b8] font-bold text-white   hover:bg-amber-600 active:bg-rose-900 border  active:border-[#808080] shadow "
              onClick={() => setConfirmModalVisible(false)}
            >
              Hủy
            </div>
            <div
              className="w-40 cursor-pointer select-none  text-center py-3 rounded-xl bg-[#E67E22] font-bold text-white   hover:bg-amber-600 active:bg-cyan-800 border  active:border-[#808080] shadow"
              onClick={handleConfirmUpdate}
            >
              Đồng ý
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
