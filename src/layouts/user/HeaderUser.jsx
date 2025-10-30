import React from "react";
import { Link } from "react-router";
import logo from "/src/assets/login/logoAutumn.png";
import { PhoneIcon, ShoppingCartIcon, UserIcon } from "@phosphor-icons/react";
import { Input } from "antd";

export default function HeaderUser() {
  return (
    <>
      <div className="flex justify-between min-h-[80px] ">
        <div className=" text-lg flex gap-8 items-center">
          <Link to={"#"}>Nữ</Link>
          <Link to={"#"}>Nam</Link>
          <Link to={"#"}>SALE OUTLET - HÀNG GIÁ CUỐI TỪ 150K</Link>
          <Link to={"#"}>Bộ sưu tập</Link>
          <Link to={"#"}>Về Chúng Tôi</Link>
          <div className="ml-10">
            <img width={80} src={logo} alt="logo" />
          </div>
        </div>

        <div className="flex items-center gap-20 ">
          <div>
            <Input />
          </div>
          <div className="flex gap-5">
            <div>
              <PhoneIcon size={24} />
            </div>
            <div>
              <UserIcon size={24} />
            </div>
            <div>
              <ShoppingCartIcon size={24} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
