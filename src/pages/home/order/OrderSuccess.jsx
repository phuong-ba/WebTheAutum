import React, { useState } from "react";
import { CheckCircle, Package, Truck, MapPin } from "lucide-react";
import { CheckCircleIcon, SealCheckIcon } from "@phosphor-icons/react";
import { useNavigate, useParams } from "react-router";

export default function OrderSuccess() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 500);
    } catch (err) {
      console.error("Copy thất bại:", err);
    }
  };
  return (
    <div className=" flex items-center justify-center ">
      <div className="bg-white rounded-2xl shadow-sm  overflow-hidden">
        <div className="text-center pt-10 pb-3">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="rounded-full flex items-center justify-center">
                <SealCheckIcon size={120} color="#ff7e05" weight="duotone" />
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Đặt hàng thành công!
          </h1>
          <p className="text-gray-600 mt-2 text-sm">
            Cảm ơn bạn đã tin tưởng và mua sắm tại cửa hàng
          </p>
        </div>
        <div className="mx-6 mb-8">
          <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-5 h-5 text-orange-500" />
              <span className="font-bold text-gray-700">
                Thông tin đơn hàng
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Mã đơn hàng:</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-orange-500">{id}</span>
                <div
                  onClick={handleCopy}
                  className={`
                    relative p-2 rounded-lg transition-all duration-200
                    ${
                      copied
                        ? "bg-emerald-500 text-white"
                        : "text-orange-500 hover:bg-orange-100 active:scale-95"
                    }
                  `}
                  title={copied ? "Đã sao chép!" : "Sao chép mã đơn"}
                >
                  {copied ? (
                    <CheckCircleIcon size={18} weight="bold" />
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  )}

                  {/* Tooltip nhỏ hiện khi copy thành công */}
                  {copied && (
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap">
                      Đã sao chép!
                    </span>
                  )}
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Đơn hàng của bạn đang được xử lý. Chúng tôi sẽ liên hệ với bạn sớm
              nhất để xác nhận và giao hàng.
            </p>
          </div>
        </div>

        <div className="px-6 pb-8">
          <div className="font-bold text-gray-800 mb-4">Các bước tiếp theo</div>

          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                1
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Xác nhận đơn hàng</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Chúng tôi sẽ gọi điện xác nhận trong vòng 24h
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 opacity-60">
              <div className="w-8 h-8 border-2 border-gray-300 text-gray-400 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                2
              </div>
              <div>
                <h4 className="font-medium text-gray-700">Chuẩn bị hàng</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Đóng gói và chuẩn bị giao hàng
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 opacity-40">
              <div className="w-8 h-8 border-2 border-gray-300 text-gray-400 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                3
              </div>
              <div>
                <h4 className="font-medium text-gray-700">Giao hàng</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Nhận hàng tại địa chỉ của bạn
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-8">
          <div className="flex gap-3">
            <div
              className="flex-1 bg-orange-500 text-white font-medium py-3.5 rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              onClick={() => navigate(`/product`)}
            >
              <Package className="w-5 h-5" />
              Tiếp tục mua sắm
            </div>
            <div
              className="flex-1 border border-gray-300 text-gray-700 font-medium py-3.5 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              onClick={() => navigate(`/your-bill`)}
            >
              <Truck className="w-5 h-5" />
              Theo dõi đơn hàng
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
              <svg
                className="w-4 h-4 text-yellow-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              Lưu ý: Vui lòng giữ mã đơn hàng để tra cứu và hỗ trợ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
