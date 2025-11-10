import React, { useState } from "react";
import bgLogin from "/src/assets/login/bglogin.jpg";
import logo from "/src/assets/login/logoAutumn.png";
import { Form, Input, message  } from "antd";
import { UserOutlined, LockOutlined, MailOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [messageApi, messageContextHolder] = message.useMessage();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      console.log("📝 Register attempt:", values);

      const response = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hoTen: values.username,
          email: values.email,
          matKhau: values.password,
          diaChi: values.diaChi || "",
          sdt: values.sdt || "",
        }),
      });

      const contentType = response.headers.get("content-type");
      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.log("Server returned non-JSON:", text);
        data = { messageApi: text };
      }

      console.log("✅ Register response:", data);
      if (response.ok) {
        messageApi.success("Đăng ký thành công!");
        navigate("/login");
      } else {
        messageApi.error(data.message || "Đăng ký thất bại!");
      }
    } catch (error) {
      console.error("❌ Register error:", error);
      messageApi.error("Đăng ký thất bại. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log("Failed:", errorInfo);
    messageApi.error("Vui lòng kiểm tra lại thông tin!");
  };

  return (
    <>
      {messageContextHolder}

      <div className="flex flex-col md:flex-row">
        <div className="hidden md:block md:w-1/2 lg:w-1/2">
          <img className="h-screen object-cover w-full" src={bgLogin} alt="" />
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
              name="register"
              className="w-full max-w-[400px]"
              initialValues={{ remember: true }}
              onFinish={onFinish}
              onFinishFailed={onFinishFailed}
              autoComplete="off"
              disabled={loading}
            >
              <Form.Item
                name="username"
                rules={[
                  { required: true, message: "Vui lòng nhập tên đăng nhập!" },
                  { min: 4, message: "Tên đăng nhập phải có ít nhất 4 ký tự!" },
                ]}
              >
                <Input
                  className="h-12"
                  prefix={<UserOutlined />}
                  placeholder="Tên đăng nhập"
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
                  className="h-12"
                  prefix={<MailOutlined />}
                  placeholder="Email"
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
                  className="h-12"
                  prefix={<LockOutlined />}
                  placeholder="Mật khẩu"
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                dependencies={["password"]}
                rules={[
                  { required: true, message: "Vui lòng xác nhận mật khẩu!" },
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
                  className="h-12"
                  prefix={<LockOutlined />}
                  placeholder="Xác nhận mật khẩu"
                />
              </Form.Item>

              <Form.Item>
                <button
                  type="submit"
                  disabled={loading}
                  className="p-4 w-full hover:border-amber-950 border bg-[#dc833a] text-center font-bold rounded cursor-pointer text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "ĐANG ĐĂNG KÝ..." : "ĐĂNG KÝ"}
                </button>
                <div className="flex justify-center mt-2 text-sm">
                  <span className="mr-1">Đã có tài khoản?</span>
                  <a
                    href="/login"
                    className="text-[#dc833a] hover:underline"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate("/login");
                    }}
                  >
                    Đăng nhập ngay
                  </a>
                </div>
              </Form.Item>
            </Form>
            <p className="text-xs md:text-xs lg:text-sm opacity-40 text-center mt-6">
              Copyright ©2025 Produced by Quyen From The Autumn Team
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
