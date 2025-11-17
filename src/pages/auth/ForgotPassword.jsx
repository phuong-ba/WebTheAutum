import React, { useState } from "react";
import bgLogin from "/src/assets/login/bglogin.jpg";
import logo from "/src/assets/login/logoAutumn.png";
import { Form, Input, message } from "antd";
import { MailOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {

      const response = await fetch("http://localhost:8080/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: values.email
        }),
      });

      const data = await response.json();

      if (data.success) {
        message.success(data.message);
        setIsSubmitted(true);
      } else {
        message.error(data.message);
      }

    } catch (error) {
      console.error("❌ Forgot password error:", error);
      message.error("Lỗi kết nối. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = (errorInfo) => {
    message.error("Vui lòng điền đầy đủ thông tin!");
  };

  return (
    <>
      <div className="flex flex-col md:flex-row ">
        <div className="hidden md:block md:w-1/2 lg:w-1/2">
          <img
            className="h-screen object-cover w-full md:h-screen lg:h-screen"
            src={bgLogin}
            alt=""
          />
        </div>

        <div className="flex flex-1 flex-col items-center gap-12 p-6 md:p-10">
          <div className="flex flex-col items-center text-center">
            <img
              src={logo}
              width={200}
              className="md:w-[250px] lg:w-[300px]"
              alt=""
            />
            <p className="text-sm md:text-base lg:text-lg mt-4">
              Hệ thống quản lý cửa hàng The Autumn trên nền tảng kỹ thuật số
            </p>
          </div>
          <div className="flex flex-1 flex-col justify-between items-center w-full">
            {!isSubmitted ? (
              <>
                <div className="w-full max-w-[400px]">
                  <h2 className="text-2xl font-bold text-center mb-2">Quên mật khẩu</h2>
                  <p className="text-sm text-center text-gray-600 mb-6">
                    Nhập email của bạn để nhận link đặt lại mật khẩu
                  </p>
                  <Form
                    name="forgotPassword"
                    className="w-full"
                    onFinish={onFinish}
                    onFinishFailed={onFinishFailed}
                    autoComplete="off"
                  >
                    <Form.Item
                      name="email"
                      rules={[
                        { required: true, message: "Vui lòng nhập email!" },
                        { type: "email", message: "Email không hợp lệ!" }
                      ]}
                    >
                      <Input
                        className="h-12"
                        prefix={<MailOutlined />}
                        placeholder="Email đã đăng ký"
                      />
                    </Form.Item>

                    <Form.Item>
                      <button
                        type="submit"
                        disabled={loading}
                        className="p-4 w-full hover:border-amber-950 border bg-[#dc833a] text-center font-bold rounded select-none items-center justify-center cursor-pointer text-white disabled:opacity-50"
                      >
                        {loading ? "ĐANG GỬI..." : "GỬI YÊU CẦU"}
                      </button>
                      <div className="flex justify-center mt-2 text-sm">
                        <a 
                          href="/login" 
                          className="text-[#dc833a] hover:underline"
                          onClick={(e) => {
                            e.preventDefault();
                            navigate("/login");
                          }}
                        >
                          ← Quay lại đăng nhập
                        </a>
                      </div>
                    </Form.Item>
                  </Form>
                </div>
              </>
            ) : (
              <div className="w-full max-w-[400px] text-center">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                  <div className="text-5xl mb-4">✉️</div>
                  <h3 className="text-xl font-bold text-green-700 mb-2">
                    Email đã được gửi!
                  </h3>
                  <p className="text-sm text-gray-600">
                    Chúng tôi đã gửi link đặt lại mật khẩu đến email của bạn. 
                    Vui lòng kiểm tra hộp thư (kể cả thư spam).
                  </p>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="w-full p-3 border border-gray-300 rounded hover:bg-gray-50 text-sm"
                  >
                    Gửi lại email
                  </button>
                  <a
                    href="/login"
                    className="block w-full p-3 bg-[#dc833a] text-white rounded hover:border-amber-950 border text-center font-bold"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate("/login");
                    }}
                  >
                    Quay lại đăng nhập
                  </a>
                </div>
              </div>
            )}
            <p className=" text-xs md:text-xs lg:text-sm opacity-40 text-center mt-6">
              Copyright ©2025 Produced by Quyen From The Autumn Team
            </p>
          </div>
        </div>
      </div>
    </>
  );
}