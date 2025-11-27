import { Breadcrumb } from "antd";
import { Link } from "react-router";

export default function LoginBreadcrumb({ page }) {
  let items = [];

  if (page === "login") {
    items = [
      { title: <Link to="/">Trang chủ</Link> },
      { title: "Đăng nhập" },
    ];
  }

  if (page === "register") {
    items = [
      { title: <Link to="/">Trang chủ</Link> },
      { title: "Đăng ký" },
    ];
  }

  if (page === "forgot") {
    items = [
      { title: <Link to="/">Trang chủ</Link> },
      { title: "Quên mật khẩu" },
    ];
  }

  return <Breadcrumb items={items} />;
}
