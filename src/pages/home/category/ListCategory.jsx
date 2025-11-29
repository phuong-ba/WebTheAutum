import React, { useEffect } from "react";
import logo from "/src/assets/login/logo.png";
import { Tooltip, Carousel } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { fetchDanhMuc, fetchSanPham } from "@/services/sanPhamService";
import { useNavigate } from "react-router";

export default function ListCategory() {
  const dispatch = useDispatch();
  const { data } = useSelector((state) => state.sanPham);
  console.log("🚀 ~ ProductAll ~ data:", data);
  const navigate = useNavigate();
  useEffect(() => {
    dispatch(fetchSanPham());
  }, [dispatch]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const categories = [
    { id: 1, title: "TitleSSSSSSSSSSSSSSSSSssssss", count: 11, image: logo },
    {
      id: 2,
      title: "Áo khoác mùa thu siêu đẹp dài vô tận nè nè nè",
      count: 8,
      image: logo,
    },
    { id: 3, title: "Thời trang công sở", count: 14, image: logo },
    { id: 4, title: "Quần jean phong cách", count: 7, image: logo },
  ];

  const colors = [
    { bg: "bg-blue-100", text: "text-blue-900" },
    { bg: "bg-green-100", text: "text-green-900" },
    { bg: "bg-red-100", text: "text-red-900" },
    { bg: "bg-yellow-100", text: "text-yellow-900" },
    { bg: "bg-orange-100", text: "text-orange-900" },
  ];

  return (
    <div className="flex flex-col gap-10 items-center">
      <div className="flex flex-col items-center gap-3">
        <div className="text-amber-500 text-sm font-semibold">
          Mua sắm theo sản phẩm
        </div>
        <div className="text-3xl font-semibold">
          Phổ biến trên cửa hàng Autumn.
        </div>
      </div>

      <div className="w-full">
        <Carousel
          arrows
          draggable
          autoplay={false}
          infinite={true}
          dots={false}
          slidesToShow={7}
          centerMode
        >
          {data.map((item, index) => {
            const color = colors[index % colors.length];
            return (
              <div key={item.id} className="flex justify-center px-1">
                <div
                  className={`${color.bg} min-w-[200px] max-w-[200px] min-h-[260px] max-h-[260px] rounded-2xl group  
                    p-5 flex flex-col justify-center items-center gap-8 shadow cursor-pointer`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Tooltip title={item.title}>
                      <div className="font-semibold text-sm max-w-[160px] truncate text-center hover:text-orange-800">
                        {item.tenSanPham}
                      </div>
                    </Tooltip>

                    <div className={`${color.text} text-xs font-semibold`}>
                      {item.chiTietSanPhams.length} sản phẩm
                    </div>
                  </div>
                  <img
                    src={item.hinhAnhSanPham[0]}
                    alt=""
                    className="w-[60px] rounded-2xl object-center transform transition-transform duration-500 ease-in-out group-hover:scale-110"
                  />
                </div>
              </div>
            );
          })}
        </Carousel>
      </div>
    </div>
  );
}
