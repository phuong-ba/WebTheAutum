import {
  DropdownIcon,
  IconMessQuestion,
  IconPhone,
} from "@/assets/svg/externalIcon";
import { ArrowBendDownLeftIcon, UserGearIcon } from "@phosphor-icons/react";
import { Dropdown, Space, Avatar } from "antd";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";

export default function Header() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({
    id: "",
    name: "",
    role: "",
    email: "",
  });

  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    const userName = localStorage.getItem("user_name");
    const userRole = localStorage.getItem("user_role");
    const userEmail = localStorage.getItem("user_email");

    console.log("👤 Header - User info from localStorage:");
    console.log("   - ID:", userId);
    console.log("   - Name:", userName);
    console.log("   - Role:", userRole);
    console.log("   - Email:", userEmail);

    setUserInfo({
      id: userId || "",
      name: userName || "NGOVINHQUYEN",
      role: userRole || "Nhân viên",
      email: userEmail || "",
    });
  }, []);

  const getAvatarFromName = (name) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  const getAvatarColor = (role) => {
    // Check both "ADMIN" and "Quản lý"
    if (role === "ADMIN" || role === "Quản lý") {
      return "#ff4d4f";
    }
    if (role === "STAFF" || role === "Nhân viên") {
      return "#1890ff";
    }
    return "#52c41a";
  };

  const isAdmin = (role) => {
    return role === "ADMIN" || role === "Quản lý";
  };

  const handleLogout = () => {
    console.log("🚪 Logging out...");

    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_type");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_role");

    console.log("✅ Đã xoá thông tin đăng nhập");
    navigate("/login");
  };

  const items = [
    {
      label: (
        <div className="px-5 py-4 min-w-[260px] border-b border-gray-100">
          <div className="flex items-center gap-4">
            <Avatar
              size={48}
              style={{
                backgroundColor: getAvatarColor(userInfo.role),
                color: "white",
                fontWeight: "bold",
                fontSize: "18px",
                flexShrink: 0,
              }}
            >
              {getAvatarFromName(userInfo.name)}
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 text-base truncate">
                {userInfo.name}
              </div>
              <div className="text-sm text-gray-500 mt-0.5 truncate">
                {userInfo.email}
              </div>
              <span
                className={`inline-block mt-2 px-2.5 py-1 rounded-md text-xs font-semibold ${
                  isAdmin(userInfo.role)
                    ? "bg-gradient-to-r from-red-50 to-red-100 text-red-600 border border-red-200"
                    : "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600 border border-blue-200"
                }`}
              >
                {isAdmin(userInfo.role) ? "Quản trị viên" : " Nhân viên"}
              </span>
            </div>
          </div>
        </div>
      ),
      key: "user-info",
      disabled: true,
    },
    {
      label: (
        <div
          onClick={() => {
            if (!userInfo.id) {
              console.error("Không tìm thấy ID người dùng");
              return;
            }
            navigate(`/admin/update-user/${userInfo.id}`);
          }}
          className="py-2 px-3  rounded-md transition-colors cursor-pointer mx-2 my-1"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">
              <UserGearIcon size={24} color="#701010" />
            </span>
            <div>
              <div className="font-medium text-gray-800 text-sm">
                Hồ sơ của tôi
              </div>
              <div className="text-xs text-gray-500">
                Xem và chỉnh sửa thông tin
              </div>
            </div>
          </div>
        </div>
      ),
      key: "profile",
    },
    {
      type: "divider",
      style: { margin: "8px 0" },
    },
    {
      label: (
        <div
          onClick={(e) => {
            e.preventDefault();
            handleLogout();
          }}
          className="py-2 px-3  rounded-md transition-colors cursor-pointer mx-2 my-1"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">
              <ArrowBendDownLeftIcon size={24} />
            </span>
            <div>
              <div className="font-semibold text-red-600 text-sm">
                Đăng xuất
              </div>
              <div className="text-xs text-red-400">Thoát khỏi hệ thống</div>
            </div>
          </div>
        </div>
      ),
      key: "logout",
    },
  ];

  return (
    <header className="w-full h-[70px] flex items-center justify-end px-10 border-b border-gray-200 bg-white">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-orange-50 rounded-lg transition-all duration-200 cursor-pointer border border-transparent hover:border-orange-200 group">
          <div className="transform group-hover:scale-110 transition-transform">
            <IconPhone />
          </div>
          <span className="text-sm font-semibold text-red-500 group-hover:text-red-600">
            0123456789
          </span>
        </div>

        <div className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 rounded-lg transition-all duration-200 cursor-pointer border border-transparent hover:border-gray-200 group">
          <div className="transform group-hover:scale-110 transition-transform">
            <IconMessQuestion />
          </div>
          <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">
            Trợ giúp
          </span>
        </div>

        <div className="h-10 w-px bg-gray-300 mx-2"></div>

        <Dropdown
          menu={{ items }}
          trigger={["click"]}
          placement="bottomRight"
          overlayClassName="user-dropdown"
          dropdownRender={(menu) => (
            <div className="bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden min-w-[280px]">
              {menu}
            </div>
          )}
        >
          <div className="cursor-pointer hover:bg-gray-50 px-4 py-2 rounded-xl transition-all duration-200 border border-transparent hover:border-gray-200 hover:shadow-sm">
            <Space size={12}>
              <Avatar
                size={42}
                style={{
                  backgroundColor: getAvatarColor(userInfo.role),
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "16px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
              >
                {getAvatarFromName(userInfo.name)}
              </Avatar>
              <div className="flex flex-col gap-1">
                <div className="font-semibold text-sm text-gray-900 leading-tight">
                  {userInfo.name}
                </div>
                <div className="text-xs text-gray-500 ">
                  {isAdmin(userInfo.role) ? "Quản trị viên" : "Nhân viên"}
                </div>
              </div>
              <div className="ml-1">
                <DropdownIcon />
              </div>
            </Space>
          </div>
        </Dropdown>
      </div>
    </header>
  );
}
