import React, { useEffect, useState } from "react";
import { Form, Input, Select, Row, Col, message, DatePicker, Spin } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllChucVu } from "@/services/chucVuService";
import dayjs from "dayjs";
import { useNavigate, useParams } from "react-router";
import UploadAvartar from "../../components/UploadAvartar";
import UserBreadcrumb from "./UserBreadcrumb";
import axios from "axios";
import { nhanVienById } from "@/services/nhanVienService";

const { Option } = Select;

export default function UpdateUser() {
  const dispatch = useDispatch();
  const { data } = useSelector((state) => state.chucvu);
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
    fetchUserData();
  }, [dispatch]);

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
      const userInfo = user.data; // <-- lấy đúng object

      setUserData(userInfo);
      form.setFieldsValue({
        maNhanVien: userInfo.maNhanVien,
        tenNhanVien: userInfo.hoTen,
        gioiTinh: userInfo.gioiTinh ? "Nam" : "Nữ",
        soDienThoai: userInfo.sdt,
        diaChi: userInfo.diaChi,
        email: userInfo.email,
        chucVu: userInfo.chucVuId,
        hinhAnh: userInfo.hinhAnh,
        ngaySinh: userInfo.ngaySinh ? dayjs(userInfo.ngaySinh) : null,
      });
      setImageUrl(userInfo.hinhAnh || null);
    } catch (error) {
      console.log(error);
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
        email: userData.email,
        chucVuId: values.chucVu,
        ngaySinh: values.ngaySinh?.toISOString(),
        trangThai: true,
        matKhau: userData.matKhau,
        hinhAnh: imageUrl,
      };

      await dispatch(updateNhanVien({ id: userData.id, nhanvien: payload }));
      messageApi.success("Cập nhật nhân viên thành công!");
      setTimeout(() => navigate("/user"), 800);
    } catch (error) {
      console.log(error);
      messageApi.error("Cập nhật thất bại! Vui lòng thử lại.");
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

                <div className="flex justify-end pr-3 gap-4">
                  <button
                    type="button"
                    onClick={() => navigate("/user")}
                    className="border border-[#E67E22] text-[#E67E22] rounded px-6 py-2 cursor-pointer hover:bg-[#E67E22] hover:text-white"
                  >
                    Hủy
                  </button>

                  <button
                    type="submit"
                    className="bg-[#E67E22] text-white rounded px-6 py-2 cursor-pointer hover:bg-[#cf6d16]"
                  >
                    Cập nhật
                  </button>
                </div>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
