import {
  DropdownIcon,
  IconMessQuestion,
  IconPhone,
} from "@/assets/svg/externalIcon";
import { DownOutlined, GlobalOutlined } from "@ant-design/icons";
import { Dropdown, Space } from "antd";
import React from "react";

export default function Header() {
  const items = [
    {
      label: (
        <a
          onClick={(e) => {
            e.preventDefault();
            handleLogout();
          }}
        >
          Đăng xuất
        </a>
      ),
      key: "0",
    },
  ];
  return (
    <>
      <header className=" w-full h-[67px]  flex items-center justify-end gap-12 px-[30px] border-b border-slate-300">
        <img src="" />
        <div className="flex items-center gap-2">
          <IconPhone />
          <p className="text-sm font-semibold text-red-500">0123456789</p>
        </div>
        <div className="flex items-center gap-2">
          <IconMessQuestion />
          <p className="text-sm font-semibold text-[#666666]">Trợ giúp</p>
        </div>
        <div className="flex items-center gap-3">
          <div>
            <Dropdown
              menu={{
                items,
              }}
              trigger={["click"]}
            >
              <a onClick={(e) => e.preventDefault()}>
                <Space className="cursor-pointer">
                  <div className="flex items-center  gap-3">
                    <div className="rounded-full bg-slate-700 w-[32px] h-[32px]"></div>
                    <p className="font-semibold text-sm">NGOVINHQUYEN</p>
                  </div>
                  <DropdownIcon />
                </Space>
              </a>
            </Dropdown>
          </div>
        </div>
      </header>
    </>
  );
}
