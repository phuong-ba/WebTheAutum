import React from "react";
import bgLogin from "/src/assets/login/bglogin.jpg";
import logo from "/src/assets/login/logoAutumn.png";
import { Button, Checkbox, Form, Input } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";

export default function Register() {
  const onFinish = (values) => {
    console.log("Success:", values);
  };
  const onFinishFailed = (errorInfo) => {
    console.log("Failed:", errorInfo);
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
            <img src={logo} width={200} className="md:w-[250px] lg:w-[300px]" alt="" />
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
                rules={[{ required: true, message: "Please input your username!" }]}
              >
                <Input
                  className="h-12"
                  prefix={<UserOutlined />}
                  placeholder="Tên đăng nhập"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: "Please input your password!" }]}
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
                  className="p-4 w-full hover:border-amber-950 border bg-[#dc833a] text-center font-bold rounded select-none items-center justify-center cursor-pointer text-white"
                >
                  Đăng nhập
                </button>
                <div className="flex justify-between mt-2 text-sm">
                  <a href="">Đăng ký</a>
                  <a href="">Quên mật khẩu</a>
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
