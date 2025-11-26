import Search from "antd/es/input/Search";
import React from "react";

export default function Advise() {
  const onSearch = (value, _e, info) => console.log(info?.source, value);
  return (
    <>
      <div className="flex justify-between bg-cyan-700  px-40 py-20 items-center ">
        <div className="flex flex-col gap-2 text-white">
          <div className="font-bold text-md">
            Giảm giá 20% tất cả các cửa hàng
          </div>
          <div className=" font-base  text-3xl font-bold ">
            Đăng ký nhận bản tin của chúng tôi
          </div>
        </div>
        <div className="w-[500px] ">
          <Search
            placeholder="Nhập Email của bạn ..."
            allowClear
            enterButton="Đăng ký"
            size="large"
            onSearch={onSearch}
          />
        </div>
      </div>
    </>
  );
}
