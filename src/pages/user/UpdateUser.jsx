import React, { useEffect, useState } from "react";
import { Form, Input, Select, Row, Col, message, DatePicker } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { updateNhanVien } from "@/services/nhanVienService";
import { fetchAllChucVu } from "@/services/chucVuService";
import dayjs from "dayjs";
import { useLocation, useNavigate } from "react-router";
import UploadAvartar from "../../components/UploadAvartar";

const { Option } = Select;

export default function UpdateUser() {
  const dispatch = useDispatch();
  const { data } = useSelector((state) => state.chucvu);
  const [form] = Form.useForm();
  const [imageUrl, setImageUrl] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();
  const location = useLocation();
  const navigate = useNavigate();
  const userFromState = location.state?.user;
  useEffect(() => {
    dispatch(fetchAllChucVu());
  }, [dispatch]);

  useEffect(() => {
    if (userFromState) {
      form.setFieldsValue({
        maNhanVien: userFromState.maNhanVien,
        tenNhanVien: userFromState.hoTen,
        gioiTinh: userFromState.gioiTinh ? "Nam" : "Nữ",
        soDienThoai: userFromState.sdt,
        diaChi: userFromState.diaChi,
        email: userFromState.email,
        chucVu: userFromState.chucVuId,
        hinhAnh: userFromState.hinhAnh,
        ngaySinh: userFromState.ngaySinh ? dayjs(userFromState.ngaySinh) : null,
        matKhau: userFromState.matKhau,
      });
      setImageUrl(userFromState.hinhAnh || null);
    }
  }, [userFromState, form]);

  const onFinish = async (values) => {
    try {
      const payload = {
        maNhanVien: userFromState.maNhanVien,
        hoTen: values.tenNhanVien,
        gioiTinh: values.gioiTinh === "Nam",
        sdt: values.soDienThoai,
        diaChi: values.diaChi,
        email: userFromState.email,
        chucVuId: values.chucVu,
        ngaySinh: values.ngaySinh?.toISOString(),
        trangThai: true,
        matKhau: userFromState.matKhau,
        hinhAnh: imageUrl,
      };

      await dispatch(
        updateNhanVien({ id: userFromState.id, nhanvien: payload })
      );
      messageApi.success("Cập nhật nhân viên thành công!");
      setTimeout(() => navigate("/user"), 800);
    } catch (error) {
      console.log("🚀 ~ onFinish ~ error:", error);
      messageApi.error("Cập nhật thất bại! Vui lòng thử lại.");
    }
  };

  return (
    <>
      {contextHolder}
      <div className="px-6 py-3">
        <p className="font-bold text-2xl text-[#E67E22]">
          Cập nhật thông tin nhân viên
        </p>
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
                  rules={[{ required: true, message: "Nhập tên nhân viên" }]}
                >
                  <Input placeholder="Nhập tên nhân viên" />
                </Form.Item>
              </Col>
              <Col flex="1">
                <Form.Item
                  name="soDienThoai"
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
    </>
  );
}
