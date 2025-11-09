import React, { useState } from "react";
import bgLogin from "/src/assets/login/bglogin.jpg";
import logo from "/src/assets/login/logoAutumn.png";
import { Form, Input, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      console.log("📧 Login attempt:", values);

      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: values.username,
          password: values.password,
        }),
      });

      console.log("🔧 Response status:", response.status);
      console.log("🔧 Response headers:", response.headers);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;

        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (e) {
          errorMessage =
            response.statusText || `HTTP error! status: ${response.status}`;
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("✅ Login success:", data);

      if (data.success) {
        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("user_type", data.userType);
        localStorage.setItem("user_name", data.hoTen);

        message.success(data.message || "Đăng nhập thành công!");

        if (data.userType === "STAFF") {
          console.log("Redirecting to admin panel...");
          navigate("/admin");
        } else if (data.userType === "CUSTOMER") {
          console.log("Redirecting to home page...");
          navigate("/");
        } else {
          console.log("Unknown user type, redirecting to home...");
          navigate("/");
        }
      } else {
        message.error(data.message || "Đăng nhập thất bại!");
      }
    } catch (error) {
      console.error("Login error:", error);

      if (error.message.includes("Failed to fetch")) {
        message.error("Không thể kết nối đến server. Kiểm tra:");
        message.error("Backend có đang chạy trên port 8080?");
        message.error("Kết nối internet?");
      } else if (
        error.message.includes("401") ||
        error.message.includes("Sai email hoặc mật khẩu")
      ) {
        message.error("Sai email hoặc mật khẩu!");
      } else if (error.message.includes("403")) {
        message.error("Truy cập bị từ chối!");
      } else if (error.message.includes("500")) {
        message.error(" Lỗi server. Vui lòng thử lại sau!");
      } else if (error.message.includes("HTTP error")) {
        message.error(`Lỗi kết nối: ${error.message}`);
      } else {
        message.error("Lỗi đăng nhập: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log("Failed:", errorInfo);
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
            <Form
              name="basic"
              className="w-full max-w-[400px]"
              initialValues={{ remember: true }}
              onFinish={onFinish}
              onFinishFailed={onFinishFailed}
              autoComplete="off"
            >
              <Form.Item
                name="username"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập email!",
                  },
                  {
                    type: "email",
                    message: "Email không hợp lệ!",
                  },
                ]}
              >
                <Input
                  className="h-12"
                  prefix={<UserOutlined />}
                  placeholder="Email đăng nhập"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập mật khẩu!",
                  },
                ]}
              >
                <Input.Password
                  className="h-12"
                  prefix={<LockOutlined />}
                  placeholder="Mật khẩu"
                />
              </Form.Item>

              <Form.Item>
                <button
                  type="submit"
                  disabled={loading}
                  className="p-4 w-full hover:border-amber-950 border bg-[#dc833a] text-center font-bold rounded select-none items-center justify-center cursor-pointer text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "ĐANG ĐĂNG NHẬP..." : "ĐĂNG NHẬP"}
                </button>
                <div className="flex justify-between mt-2 text-sm">
                  <a
                    href="/register"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate("/register");
                    }}
                  >
                    Đăng ký
                  </a>
                  <a
                    href="/forgotpass"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate("/forgotpass");
                    }}
                  >
                    Quên mật khẩu
                  </a>
                </div>
              </Form.Item>
            </Form>
            <p className=" text-xs md:text-xs lg:text-sm opacity-40 text-center mt-6">
              Copyright ©2025 Produced by Quyen From The Autumn Team
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
