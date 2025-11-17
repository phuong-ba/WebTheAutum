import React, { useState } from "react";
import bgLogin from "/src/assets/login/bglogin.jpg";
import logo from "/src/assets/login/logoAutumn.png";
import { Form, Input, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const onFinish = async (values) => {
    setLoading(true);
    try {

      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: values.email,
          matKhau: values.password,
        }),
      });

      const data = await response.json();

      if (data.accessToken) {
        localStorage.setItem("auth_token", data.accessToken);
        localStorage.setItem("token_type", data.typeToken || "Bearer");
        localStorage.setItem("user_name", data.hoTen || "");
        localStorage.setItem("user_email", data.email || "");
        localStorage.setItem("user_role", data.chucVuName);
        localStorage.setItem("user_id", data.id);
        localStorage.setItem("user_img", data.hinhAnh || "");

        localStorage.setItem(
          "login_success_data",
          JSON.stringify({
            name: data.hoTen || "Người dùng",
            role: data.chucVuName || "Nhân viên",
            timestamp: Date.now(),
          })
        );

        const role = (data.chucVuName || "").trim().toLowerCase();

        if (role === "quản lý" || role === "admin") {
          navigate("/admin");
        } else {
          navigate("/admin");
        }
      } else {
        messageApi.error({
          content: (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              <div style={{ fontWeight: "bold" }}>Đăng nhập thất bại</div>
              <div style={{ fontSize: "13px" }}>
                {data.message || "Sai email hoặc mật khẩu"}
              </div>
            </div>
          ),
          duration: 4,
        });
      }
    } catch (error) {
      console.error("❌ Login error:", error);

      messageApi.error({
        content: (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ fontWeight: "bold" }}>⚠️ Lỗi kết nối</div>
            <div style={{ fontSize: "13px" }}>
              Không thể kết nối đến máy chủ. Vui lòng thử lại!
            </div>
          </div>
        ),
        duration: 5,
      });
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = () => {
    messageApi.warning({
      content: "⚠️ Vui lòng nhập đầy đủ thông tin đăng nhập!",
      duration: 3,
    });
  };

  return (
    <div className="flex flex-col md:flex-row">
      {contextHolder}
      <div className="hidden md:block md:w-1/2 lg:w-1/2">
        <img
          src={bgLogin}
          alt="background"
          className="h-screen object-cover w-full"
        />
      </div>

      <div className="flex flex-1 flex-col items-center gap-12 p-6 md:p-10">
        <div className="flex flex-col items-center text-center">
          <img src={logo} alt="Logo" className="md:w-[250px] lg:w-[300px]" />
          <p className="text-sm md:text-base lg:text-lg mt-4">
            Hệ thống quản lý cửa hàng <b>The Autumn</b>
          </p>
        </div>

        <div className="flex flex-1 flex-col justify-between items-center w-full">
          <Form
            name="loginForm"
            className="w-full max-w-[400px]"
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            autoComplete="off"
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: "Vui lòng nhập email!" },
                { type: "email", message: "Email không hợp lệ!" },
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
              rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
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
                className="p-4 w-full hover:border-amber-950 border bg-[#dc833a] text-white font-bold rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "ĐANG ĐĂNG NHẬP..." : "ĐĂNG NHẬP"}
              </button>

              <div className="flex justify-between mt-2 text-sm">
                <a></a>
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

          <p className="text-xs md:text-xs lg:text-sm opacity-40 text-center mt-6">
            ©2025 The Autumn Team — All Rights Reserved
          </p>
        </div>
      </div>
    </div>
  );
}
