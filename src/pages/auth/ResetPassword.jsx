import React, { useState, useEffect } from "react";
import bgLogin from "/src/assets/login/bglogin.jpg";
import logo from "/src/assets/login/logoAutumn.png";
import { Form, Input, message } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function ResetPassword() {
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [token, setToken] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      message.error("Token không hợp lệ!");
      navigate("/forgotpass");
    }
  }, [searchParams, navigate]);

  const onFinish = async (values) => {
    setLoading(true);
    try {

      const response = await fetch("http://localhost:8080/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: token,
          newPassword: values.newPassword
        }),
      });

      const data = await response.json();

      if (data.success) {
        message.success(data.message);
        setIsSuccess(true);
      } else {
        message.error(data.message);
      }

    } catch (error) {
      console.error("❌ Reset password error:", error);
      message.error("Lỗi kết nối. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = (errorInfo) => {
    message.error("Vui lòng kiểm tra lại thông tin!");
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
            <div className="w-full max-w-[400px]">
              <h2 className="text-2xl font-bold text-center mb-2">Đặt lại mật khẩu</h2>
              
              {!isSuccess && (
                <div className="token-info bg-gray-100 p-4 rounded-lg mb-4 border-l-4 border-[#dc833a]">
                  <p className="text-sm text-gray-600 mb-2">Token reset:</p>
                  <code className="text-xs break-all">{token}</code>
                </div>
              )}

              {!isSuccess ? (
                <Form
                  name="resetPassword"
                  className="w-full"
                  onFinish={onFinish}
                  onFinishFailed={onFinishFailed}
                  autoComplete="off"
                >
                  <Form.Item
                    name="newPassword"
                    rules={[
                      { required: true, message: "Vui lòng nhập mật khẩu mới!" },
                      { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự!" }
                    ]}
                  >
                    <Input.Password
                      className="h-12"
                      prefix={<LockOutlined />}
                      placeholder="Mật khẩu mới"
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
                      className="h-12"
                      prefix={<LockOutlined />}
                      placeholder="Xác nhận mật khẩu"
                    />
                  </Form.Item>

                  <Form.Item>
                    <button
                      type="submit"
                      disabled={loading}
                      className="p-4 w-full hover:border-amber-950 border bg-[#dc833a] text-center font-bold rounded select-none items-center justify-center cursor-pointer text-white disabled:opacity-50"
                    >
                      {loading ? "ĐANG XỬ LÝ..." : "ĐẶT LẠI MẬT KHẨU"}
                    </button>
                    
                    <div className="flex justify-center mt-4 text-sm">
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
              ) : (
                <div className="text-center">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                    <div className="text-5xl mb-4">✅</div>
                    <h3 className="text-xl font-bold text-green-700 mb-2">
                      Thành công!
                    </h3>
                    <p className="text-sm text-gray-600">
                      Mật khẩu đã được đặt lại thành công. Bạn có thể đăng nhập với mật khẩu mới.
                    </p>
                  </div>
                  <a
                    href="/login"
                    className="block w-full p-3 bg-[#dc833a] text-white rounded hover:border-amber-950 border text-center font-bold"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate("/login");
                    }}
                  >
                    ĐĂNG NHẬP NGAY
                  </a>
                </div>
              )}
            </div>

            <p className="text-xs md:text-xs lg:text-sm opacity-40 text-center mt-6">
              Copyright ©2025 Produced by Quyen From The Autumn Team
            </p>
          </div>
        </div>
      </div>
    </>
  );
}