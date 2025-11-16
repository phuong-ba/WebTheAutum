import React, { useState } from "react";
import { Form, Input, message, Steps } from "antd";
import { MailOutlined, LockOutlined, CheckCircleOutlined } from "@ant-design/icons";

export default function CustomerForgotPassword({ onBackToLogin }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [messageApi, contextHolder] = message.useMessage();

  const onRequestReset = async (values) => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8080/api/customer/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: values.email,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setEmail(values.email);
        setCurrentStep(1);
        messageApi.success(data.message || "Hướng dẫn reset mật khẩu đã được gửi đến email của bạn!");
      } else {
        messageApi.error(data.message || "Có lỗi xảy ra. Vui lòng thử lại!");
      }
    } catch (error) {
      console.error("❌ Forgot password error:", error);
      messageApi.error("Không thể kết nối đến máy chủ. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const onResetPassword = async (values) => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8080/api/customer/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: values.token,
          newPassword: values.newPassword,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setCurrentStep(2);
        messageApi.success(data.message || "Đặt lại mật khẩu thành công!");
      } else {
        messageApi.error(data.message || "Token không hợp lệ hoặc đã hết hạn!");
      }
    } catch (error) {
      console.error("❌ Reset password error:", error);
      messageApi.error("Không thể kết nối đến máy chủ. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: "Nhập email",
      content: (
        <Form onFinish={onRequestReset} layout="vertical" className="space-y-4">
          <div className="text-center mb-4">
            <MailOutlined className="text-4xl text-orange-500 mb-2" />
            <h3 className="text-lg font-semibold text-gray-800">Quên mật khẩu</h3>
            <p className="text-gray-600 text-sm">Nhập email để nhận mã đặt lại mật khẩu</p>
          </div>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Vui lòng nhập email!" },
              { type: "email", message: "Email không hợp lệ!" },
            ]}
          >
            <Input
              size="large"
              prefix={<MailOutlined className="text-gray-400" />}
              placeholder="Email đăng ký tài khoản"
              className="rounded-lg hover:border-orange-300 focus:border-orange-500"
            />
          </Form.Item>
          
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onBackToLogin}
              className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:border-orange-300 hover:text-orange-600 transition-all duration-300"
            >
              Quay lại
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {loading ? "Đang gửi..." : "Gửi yêu cầu"}
            </button>
          </div>
        </Form>
      ),
    },
    {
      title: "Đặt mật khẩu mới",
      content: (
        <Form onFinish={onResetPassword} layout="vertical" className="space-y-4">
          <div className="text-center mb-4">
            <LockOutlined className="text-4xl text-orange-500 mb-2" />
            <h3 className="text-lg font-semibold text-gray-800">Đặt mật khẩu mới</h3>
            <p className="text-gray-600 text-sm">Nhập mã xác nhận và mật khẩu mới</p>
            <p className="text-orange-500 text-xs mt-1">Mã xác nhận đã được gửi đến: {email}</p>
          </div>

          <Form.Item
            name="token"
            rules={[
              { required: true, message: "Vui lòng nhập mã xác nhận!" },
            ]}
          >
            <Input
              size="large"
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="Mã xác nhận từ email"
              className="rounded-lg hover:border-orange-300 focus:border-orange-500"
            />
          </Form.Item>

          <Form.Item
            name="newPassword"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu mới!" },
              { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự!" },
            ]}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="Mật khẩu mới"
              className="rounded-lg hover:border-orange-300 focus:border-orange-500"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: "Vui lòng xác nhận mật khẩu!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                },
              }),
            ]}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="Xác nhận mật khẩu mới"
              className="rounded-lg hover:border-orange-300 focus:border-orange-500"
            />
          </Form.Item>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => setCurrentStep(0)}
              className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:border-orange-300 hover:text-orange-600 transition-all duration-300"
            >
              Quay lại
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
            </button>
          </div>
        </Form>
      ),
    },
    {
      title: "Hoàn thành",
      content: (
        <div className="text-center py-8">
          <CheckCircleOutlined className="text-5xl text-green-500 mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Thành công!</h3>
          <p className="text-gray-600 mb-6">Mật khẩu đã được đặt lại thành công.</p>
          <button
            onClick={onBackToLogin}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Đăng nhập ngay
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
      {contextHolder}
      
      <Steps
        current={currentStep}
        items={[
          { title: 'Email' },
          { title: 'Mật khẩu' },
          { title: 'Hoàn thành' },
        ]}
        className="mb-6"
      />
      
      {steps[currentStep].content}
    </div>
  );
}