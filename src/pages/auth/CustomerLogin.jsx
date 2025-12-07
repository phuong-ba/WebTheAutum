import React, { useState } from "react";
import { Form, Input, message, Checkbox } from "antd";
import {
  UserOutlined,
  LockOutlined,
  ShoppingOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import logo from "/src/assets/login/logoAutumn.png";
import CustomerForgotPassword from "./CustomerForgotPassword";
import ClientBreadcrumb from "../home/ClientBreadcrumb";
import LoginBreadcrumb from "./LoginBreadcrumb";
import authServiceAPI from "@/api/authAPI";

export default function CustomerLogin() {
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const onLoginFinish = async (values) => {
    setLoading(true);
    try {
      const data = await authServiceAPI.loginCustomer(
        values.email,
        values.password
      );

      if (data.accessToken) {
        localStorage.setItem("customer_token", data.accessToken);
        localStorage.setItem("customer_type", data.typeToken || "Bearer");
        localStorage.setItem("customer_name", data.hoTen || "");
        localStorage.setItem("customer_email", data.email || "");
        localStorage.setItem("customer_id", data.id);
        localStorage.setItem("customer_phone", data.sdt || "");

        localStorage.setItem(
          "customer_login_success",
          JSON.stringify({
            name: data.hoTen || "Khách hàng",
            email: data.email,
            timestamp: Date.now(),
          })
        );
        window.dispatchEvent(new Event("customerLogin"));
        messageApi.success({
          content: `Chào mừng ${data.hoTen}! Đăng nhập thành công 🎉`,
          duration: 2,
        });

        setTimeout(() => {
          navigate("/");
        }, 500);
      } else {
        messageApi.error({
          content: data.message || "Email hoặc mật khẩu không đúng!",
          duration: 3,
        });
      }
    } catch (error) {
      console.error("❌ Customer login error:", error);
      messageApi.error({
        content: "Không thể kết nối đến máy chủ. Vui lòng thử lại!",
        duration: 3,
      });
    } finally {
      setLoading(false);
    }
  };

  const onRegisterFinish = async (values) => {
    setLoading(true);
    try {
      await authServiceAPI.registerCustomer({
        hoTen: values.hoTen,
        email: values.email,
        matKhau: values.password,
        diaChi: values.diaChi || "",
        // Nếu backend không yêu cầu gioiTinh thì bỏ, hoặc thêm nếu cần
        // gioiTinh: values.gioiTinh ?? true,
      });

      messageApi.success({
        content: "Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.",
        duration: 4,
      });

      // Chuyển sang form đăng nhập
      setIsLogin(true);
    } catch (error) {
      console.error("Customer register error:", error);

      messageApi.error({
        content: error.message || "Đăng ký thất bại. Vui lòng thử lại!",
        duration: 4,
      });
    } finally {
      setLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className=" flex flex-col gap-3 items-center justify-center  overflow-hidden bg-gradient-to-br ">
        {contextHolder}
        <div className="flex flex-col items-center gap-3">
          <div className="font-bold text-3xl">Quên mật khẩu</div>
          <LoginBreadcrumb page="forgot" />
        </div>
        <div className="xz-10 w-full max-w-md mx-4">
          <CustomerForgotPassword
            onBackToLogin={() => setShowForgotPassword(false)}
          />
        </div>

        <style>{`
          @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          .animate-blob {
            animation: blob 7s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <div className=" flex flex-col gap-10 items-center justify-center relative overflow-hidden ">
        <div className="flex flex-col items-center gap-3">
          <div className="font-bold text-3xl">
            {isLogin ? "Đăng nhập" : "Đăng ký"}
          </div>
          <LoginBreadcrumb page={isLogin ? "login" : "register"} />
        </div>
        {contextHolder}
        <div className="relative z-10 w-full max-w-xl mx-4">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm bg-opacity-95 border border-orange-100">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 text-center">
              <div className="flex justify-center mb-3">
                <div className="bg-white rounded-full p-3 shadow-lg transform hover:scale-105 transition-transform duration-300">
                  <img
                    src={logo}
                    alt="Logo"
                    className="md:w-[75px] lg:w-[100px]"
                  />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">The Autumn</h1>
              <p className="text-orange-100 text-sm opacity-90">
                {isLogin
                  ? "Chào mừng bạn quay trở lại!"
                  : "Bắt đầu hành trình mới với chúng tôi"}
              </p>
            </div>

            <div className="p-6">
              <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-all duration-300 cursor-pointer ${
                    isLogin
                      ? "bg-white text-orange-600 shadow-sm  "
                      : "text-gray-600 hover:text-orange-500"
                  }`}
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-all duration-300 cursor-pointer ${
                    !isLogin
                      ? "bg-white text-orange-600 shadow-sm "
                      : "text-gray-600 hover:text-orange-500"
                  }`}
                >
                  Đăng ký
                </button>
              </div>

              {isLogin ? (
                <Form
                  name="customerLogin"
                  onFinish={onLoginFinish}
                  autoComplete="off"
                  layout="vertical"
                  className="space-y-4"
                >
                  <Form.Item
                    name="email"
                    rules={[
                      { required: true, message: "Vui lòng nhập email!" },
                      { type: "email", message: "Email không hợp lệ!" },
                    ]}
                  >
                    <Input
                      size="large"
                      prefix={<UserOutlined className="text-gray-400" />}
                      placeholder="Email của bạn"
                      className="rounded-lg hover:border-orange-300 focus:border-orange-500"
                    />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    rules={[
                      { required: true, message: "Vui lòng nhập mật khẩu!" },
                    ]}
                  >
                    <Input.Password
                      size="large"
                      prefix={<LockOutlined className="text-gray-400" />}
                      placeholder="Mật khẩu"
                      className="rounded-lg hover:border-orange-300 focus:border-orange-500"
                    />
                  </Form.Item>

                  <Form.Item
                    name="remember"
                    valuePropName="checked"
                    className="mb-4"
                  >
                    <div className="flex justify-between items-center">
                      <Checkbox className="text-gray-600 hover:text-orange-600">
                        Ghi nhớ đăng nhập
                      </Checkbox>
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-orange-600 hover:text-orange-700 text-sm font-medium transition-colors bg-transparent border-none cursor-pointer"
                      >
                        Quên mật khẩu?
                      </button>
                    </div>
                  </Form.Item>

                  <Form.Item>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white cursor-pointer font-semibold rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] border-0"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Đang đăng nhập...
                        </span>
                      ) : (
                        "Đăng nhập"
                      )}
                    </button>
                  </Form.Item>
                </Form>
              ) : (
                <Form
                  name="customerRegister"
                  onFinish={onRegisterFinish}
                  autoComplete="off"
                  layout="vertical"
                  className="space-y-4"
                >
                  <Form.Item
                    name="hoTen"
                    rules={[
                      { required: true, message: "Vui lòng nhập họ tên!" },
                      { min: 3, message: "Họ tên phải có ít nhất 3 ký tự!" },
                    ]}
                  >
                    <Input
                      size="large"
                      prefix={<UserOutlined className="text-gray-400" />}
                      placeholder="Họ và tên"
                      className="rounded-lg hover:border-orange-300 focus:border-orange-500"
                    />
                  </Form.Item>

                  <Form.Item
                    name="email"
                    rules={[
                      { required: true, message: "Vui lòng nhập email!" },
                      { type: "email", message: "Email không hợp lệ!" },
                    ]}
                  >
                    <Input
                      size="large"
                      prefix={<UserOutlined className="text-gray-400" />}
                      placeholder="Email"
                      className="rounded-lg hover:border-orange-300 focus:border-orange-500"
                    />
                  </Form.Item>

                  <Form.Item
                    name="sdt"
                    rules={[
                      {
                        pattern: /^[0-9]{10,11}$/,
                        message: "Số điện thoại không hợp lệ!",
                      },
                    ]}
                  >
                    <Input
                      size="large"
                      prefix={<PhoneOutlined className="text-gray-400" />}
                      placeholder="Số điện thoại (không bắt buộc)"
                      className="rounded-lg hover:border-orange-300 focus:border-orange-500"
                    />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    rules={[
                      { required: true, message: "Vui lòng nhập mật khẩu!" },
                      { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự!" },
                    ]}
                  >
                    <Input.Password
                      size="large"
                      prefix={<LockOutlined className="text-gray-400" />}
                      placeholder="Mật khẩu"
                      className="rounded-lg hover:border-orange-300 focus:border-orange-500"
                    />
                  </Form.Item>

                  <Form.Item
                    name="confirmPassword"
                    dependencies={["password"]}
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng xác nhận mật khẩu!",
                      },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue("password") === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(
                            new Error("Mật khẩu xác nhận không khớp!")
                          );
                        },
                      }),
                    ]}
                  >
                    <Input.Password
                      size="large"
                      prefix={<LockOutlined className="text-gray-400" />}
                      placeholder="Xác nhận mật khẩu"
                      className="rounded-lg hover:border-orange-300 focus:border-orange-500"
                    />
                  </Form.Item>

                  <Form.Item>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full  py-3 bg-gradient-to-r from-orange-500 to-amber-500 cursor-pointer text-white font-semibold rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] border-0"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 "></div>
                          Đang đăng ký...
                        </span>
                      ) : (
                        "Đăng ký ngay"
                      )}
                    </button>
                  </Form.Item>
                </Form>
              )}
            </div>
          </div>

          <p className="text-center text-gray-500 text-xs pt-12 opacity-75">
            ©2025 The Autumn Team — All Rights Reserved
          </p>
        </div>

        <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
      </div>
    </>
  );
}
