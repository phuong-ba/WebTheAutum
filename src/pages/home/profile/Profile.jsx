// src/pages/client/Profile.jsx
import React, { useEffect, useState } from "react";

import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  message,
  Modal,
  Form,
  Input,
  DatePicker,
  Radio,
  Button,
  Spin,
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import { getByIdKhachHang } from "@/services/khachHangService";
import baseUrl from "@/api/instance";
import {
  Calendar1Icon,
  DnaIcon,
  Edit2Icon,
  MailCheckIcon,
  PhoneCallIcon,
  User2Icon,
} from "lucide-react";
import dayjs from "dayjs";
const { Item } = Form;

export default function Profile() {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const customerId = localStorage.getItem("customer_id");

  const {
    dataById,
    loading: reduxLoading,
    error,
  } = useSelector((state) => state.khachHang || {});

  useEffect(() => {
    if (customerId) {
      dispatch(getByIdKhachHang(customerId));
    } else {
      setLoading(false);
      messageApi.warning("Vui lòng đăng nhập để xem hồ sơ!");
    }
  }, [dispatch, customerId]);

  useEffect(() => {
    if (dataById) {
      setCustomer(dataById);
      form.setFieldsValue({
        ho_ten: dataById.hoTen,
        email: dataById.email,
        sdt: dataById.sdt,
        ngay_sinh: dataById.ngaySinh ? dayjs(dataById.ngaySinh) : null,
        gioi_tinh:
          dataById.gioiTinh === null ? null : dataById.gioiTinh ? 1 : 0,
      });
      setLoading(false);
    }
  }, [dataById, form]);

  const handleUpdateProfile = async (values) => {
    try {
      setLoading(true);
      const payload = {
        hoTen: values.ho_ten,
        email: values.email,
        sdt: values.sdt,
        ngaySinh: values.ngay_sinh
          ? values.ngay_sinh.format("YYYY-MM-DD")
          : null,
        gioiTinh: values.gioi_tinh === 1,
        trangThai: true,
      };

      await baseUrl.put(`/khach-hang/update/${customerId}`, payload);

      dispatch(getByIdKhachHang(customerId));

      messageApi.success("Cập nhật thông tin thành công!");
      setIsEditing(false);
    } catch (err) {
      messageApi.error(err.response?.data?.message || "Cập nhật thất bại!");
    } finally {
      setLoading(false);
    }
  };

  if (!customerId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-lg text-gray-600">Vui lòng đăng nhập để xem hồ sơ</p>
      </div>
    );
  }

  if (loading || reduxLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spin size="large" tip="Đang tải thông tin..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500">Lỗi: {error}</p>
      </div>
    );
  }

  return (
    <>
      {contextHolder}
      <div className="min-h-screen bg-gray-50 py-10 px-4">
        <div className=" mx-auto">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-pink-600 h-32 relative">
              <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
                <div className="w-32 h-32 bg-white rounded-full p-2 shadow-2xl">
                  <div className="w-full h-full bg-gradient-to-br from-orange-100 to-pink-100 rounded-full flex items-center justify-center border-4 border-white">
                    <User2Icon className="w-16 h-16 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>
            <div className="pt-20 pb-8 text-center">
              <h1 className="text-3xl font-bold text-gray-800">
                {customer?.hoTen || "Khách hàng"}
              </h1>
              <p className="text-gray-500 mt-2">
                Thành viên từ{" "}
                {customer?.ngayTao
                  ? format(new Date(customer.ngayTao), "dd 'tháng' MM, yyyy", {
                      locale: vi,
                    })
                  : "Gần đây"}
              </p>
            </div>
          </div>

          {/* Thông tin chi tiết */}
          <div className="mt-10 bg-white rounded-2xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800">
                Thông tin cá nhân
              </h2>
              <Button
                type="primary"
                size="large"
                icon={<Edit2Icon className="w-4 h-4" />}
                onClick={() => setIsEditing(true)}
                className="bg-orange-600 hover:bg-orange-700 border-none"
              >
                Chỉnh sửa
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <InfoItem
                icon={<User2Icon />}
                label="Họ và tên"
                value={customer?.hoTen}
              />
              <InfoItem
                icon={<MailCheckIcon />}
                label="Email"
                value={customer?.email}
                color="blue"
              />
              <InfoItem
                icon={<PhoneCallIcon />}
                label="Số điện thoại"
                value={customer?.sdt}
                color="green"
              />
              <InfoItem
                icon={<DnaIcon />}
                label="Giới tính"
                value={
                  customer?.gioiTinh === null
                    ? "Chưa cập nhật"
                    : customer.gioiTinh
                    ? "Nam"
                    : "Nữ"
                }
                color="purple"
              />
              <InfoItem
                icon={<Calendar1Icon />}
                label="Ngày sinh"
                value={
                  customer?.ngaySinh
                    ? format(new Date(customer.ngaySinh), "dd/MM/yyyy")
                    : "Chưa cập nhật"
                }
                color="pink"
              />
            </div>
          </div>
        </div>

        <Modal
          title="Chỉnh sửa thông tin cá nhân"
          open={isEditing}
          onCancel={() => setIsEditing(false)}
          footer={null}
          width={600}
          destroyOnClose
        >
          <Form form={form} layout="vertical" onFinish={handleUpdateProfile}>
            <Item
              name="ho_ten"
              label="Họ và tên"
              rules={[{ required: true, message: "Vui lòng nhập họ tên!" }]}
            >
              <Input size="large" placeholder="Nguyễn Văn A" />
            </Item>

            <Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Vui lòng nhập email!" },
                { type: "email", message: "Email không hợp lệ!" },
              ]}
            >
              <Input size="large" placeholder="example@gmail.com" />
            </Item>

            <Item
              name="sdt"
              label="Số điện thoại"
              rules={[
                { required: true, message: "Vui lòng nhập số điện thoại!" },
                { pattern: /^0[1-9]\d{8,9}$/, message: "SĐT không hợp lệ!" },
              ]}
            >
              <Input size="large" placeholder="0901234567" />
            </Item>

            <Item name="gioi_tinh" label="Giới tính">
              <Radio.Group>
                <Radio value={1}>Nam</Radio>
                <Radio value={0}>Nữ</Radio>
              </Radio.Group>
            </Item>

            <Item name="ngay_sinh" label="Ngày sinh">
              <DatePicker
                format="DD/MM/YYYY"
                placeholder="Chọn ngày sinh"
                style={{ width: "100%" }}
                size="large"
              />
            </Item>

            <div className="flex justify-end gap-3 mt-6">
              <Button onClick={() => setIsEditing(false)}>Hủy</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="bg-orange-600"
              >
                Lưu thay đổi
              </Button>
            </div>
          </Form>
        </Modal>
      </div>
    </>
  );
}

const InfoItem = ({ icon, label, value, color = "orange" }) => {
  const colors = {
    orange: "bg-orange-100 text-orange-600",
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    pink: "bg-pink-100 text-pink-600",
  };

  return (
    <div className="flex items-center gap-4">
      <div
        className={`w-12 h-12 ${colors[color]} rounded-xl flex items-center justify-center `}
      >
        {React.cloneElement(icon, { className: "w-6 h-6" })}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-lg font-semibold text-gray-800">
          {value || "Chưa cập nhật"}
        </p>
      </div>
    </div>
  );
};
