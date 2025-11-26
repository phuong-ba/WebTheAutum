import React from "react";
import logo from "/src/assets/login/logo.png";
import payment from "/src/assets/img/footer-pay.png";
import {
  IconEmail,
  IconFaceBook,
  IconLinkerIn,
  IconMap,
  IconTwitter,
  IconVimeo,
} from "@/assets/svg/externalIcon";
import { NavLink } from "react-router";
export default function FooterUser() {
  return (
    <>
      <div className="flex flex-col px-40 py-10 gap-10">
        <div className="flex justify-between items-center gap-20">
          <div className="flex flex-col gap-5">
            <div className="w-18 ">
              <img src={logo} alt="" />
            </div>
            <div className="max-w-[320px] text-lg">
              Chúng tôi là một nhóm các nhà thiết kế và nhà phát triển tạo ra
              AuTumn chất lượng cao
            </div>
            <div className="flex gap-2">
              <div className="group w-10 p-3 bg-white shadow rounded-md cursor-pointer hover:bg-blue-500">
                <IconFaceBook className="text-gray-800 group-hover:text-white" />
              </div>

              <div className="group w-10 p-3 bg-white shadow rounded-md cursor-pointer hover:bg-blue-500">
                <IconTwitter className="text-gray-800 group-hover:text-white" />
              </div>

              <div className="group w-10 p-3 bg-white shadow rounded-md cursor-pointer hover:bg-blue-500">
                <IconLinkerIn className="text-gray-800 group-hover:text-white" />
              </div>

              <div className="group w-10 p-3 bg-white shadow rounded-md cursor-pointer hover:bg-blue-500">
                <IconVimeo className="text-gray-800 group-hover:text-white" />
              </div>
            </div>
          </div>
          <div className="flex flex-1 gap-20 items-center justify-center">
            <div className="flex flex-col gap-5">
              <div className="font-bold text-2xl">Tài khoản của tôi</div>
              <div className="flex flex-col gap-3 font-semibold text-sm text-gray-600">
                <NavLink className="hover:text-blue-500 transition">
                  Theo dõi đơn hàng
                </NavLink>
                <NavLink className="hover:text-blue-500 transition">
                  Danh sách yêu thích
                </NavLink>
                <NavLink className="hover:text-blue-500 transition">
                  Tài khoản của tôi
                </NavLink>
                <NavLink className="hover:text-blue-500 transition">
                  Lịch sử đơn hàng
                </NavLink>
                <NavLink className="hover:text-blue-500 transition">
                  Vận chuyển
                </NavLink>
              </div>
            </div>
            <div className="flex flex-col gap-5">
              <div className="font-bold text-2xl">Thông tin</div>
              <div className="flex flex-col gap-3 font-semibold text-sm text-gray-600">
                <NavLink className="hover:text-blue-500 transition">
                  Câu chuyện của chúng tôi
                </NavLink>
                <NavLink className="hover:text-blue-500 transition">
                  Chính sách bảo mật
                </NavLink>
                <NavLink className="hover:text-blue-500 transition">
                  Lịch sử đơn hàng
                </NavLink>
                <NavLink className="hover:text-blue-500 transition">
                  Điều khoản & Điều kiện
                </NavLink>
                <NavLink className="hover:text-blue-500 transition">
                  Liên hệ với chúng tôi
                </NavLink>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-5">
            <div className="font-bold text-2xl">Liên hệ với chúng tôi</div>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col ">
                <div className="text-sm text-gray-600">
                  Có thắc mắc? Hãy gọi cho chúng tôi
                </div>
                <div className="font-bold text-2xl">0123456789</div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex gap-2 items-center text-gray-600">
                  <IconEmail />
                  <div>autumn@support.com</div>
                </div>
                <div className="flex gap-2 items-start  text-gray-600">
                  <IconMap />
                  <div className="max-w-[300px]">
                    Cao đẳng FPT, Trịnh Văn Bô, Hà Nội
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t-1 border-gray-400 py-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            © 2025 Cửa hàng thời trang The Autumn - Địa chỉ: Ngõ 120 Yên Lãng,
            Đống Đa, Hà Nội.
          </div>
          <div>
            <img src={payment} alt="" />
          </div>
        </div>
      </div>
    </>
  );
}
