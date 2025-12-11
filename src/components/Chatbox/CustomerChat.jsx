import React, { useState, useEffect, useRef } from "react";
import SockJS from "sockjs-client";
import { over } from "stompjs";
import { chatBotApi } from "@/api/chatBot";

function ProductCard({ product }) {
  const linkPro = import.meta.env.VITE_LINK_URL;
  const productLink = `${linkPro}/productDetail/${product.id}`;

  return (
    <a
      href={productLink}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
    >
      <div className="flex p-3 gap-3">
        <img
          src={
            product.hinhAnhSanPham?.[0] || product.image || "/placeholder.png"
          }
          alt={product.tenSanPham}
          className="w-20 h-20 object-cover rounded-lg"
        />
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-gray-800 line-clamp-2">
            {product.tenSanPham || product.name}
          </h4>
          <p className="text-orange-600 font-bold text-lg mt-1">
            {(product.price || 0).toLocaleString()}₫
          </p>
          {product.color && (
            <p className="text-xs text-gray-500 mt-1">Màu: {product.color}</p>
          )}
        </div>
      </div>
      <div className="bg-orange-500 text-white text-center py-2 text-sm font-medium hover:bg-orange-600 transition">
        Xem & Mua ngay
      </div>
    </a>
  );
}

export default function CustomerChat() {
  const [customerId] = useState(localStorage.getItem("customer_id"));
  const [hoTen] = useState(localStorage.getItem("customer_name") || "Khách");
  const [roomId, setRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [typingStatus, setTypingStatus] = useState("");
  const [hasStaffJoined, setHasStaffJoined] = useState(false);
  const [open, setOpen] = useState(false);

  const stompClient = useRef(null);
  const subscriptionRef = useRef(null);
  const bottomRef = useRef();

  // Connect khi mở chat
  useEffect(() => {
    if (!open) return;

    const initChat = async () => {
      try {
        const res = customerId
          ? await chatBotApi.getRoomByCustomer(customerId)
          : await chatBotApi.getGuestRoom();

        const { roomId } = res.data;
        setRoomId(roomId);
        connectWS(roomId);
        loadHistory(roomId);
      } catch (err) {
        console.error("Không thể khởi tạo chat:", err);
      }
    };

    initChat();

    return () => {
      subscriptionRef.current?.unsubscribe();
      stompClient.current?.disconnect();
    };
  }, [open, customerId]);

  const loadHistory = async (rid) => {
    try {
      const res = await chatBotApi.getChatHistory(rid);
      const msgs = (
        Array.isArray(res.data) ? res.data : res.data?.messages || []
      ).map((m) => {
        if (m.guiTu === 2) {
          try {
            return { ...m, parsed: JSON.parse(m.noiDung) };
          } catch {
            return { ...m, parsed: { message: m.noiDung, products: [] } };
          }
        }
        return m;
      });
      setMessages(msgs);
    } catch (e) {
      console.error(e);
    }
  };

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const connectWS = (rid) => {
    const sock = new SockJS(`${apiBaseUrl}`);
    stompClient.current = over(sock);

    stompClient.current.connect({}, () => {
      subscriptionRef.current = stompClient.current.subscribe(
        `/topic/chat/${rid}`,
        (msg) => {
          const body = JSON.parse(msg.body);
          let parsed = {};

          if (body.guiTu === 2) {
            try {
              parsed = JSON.parse(body.noiDung);
            } catch {
              parsed = { message: body.noiDung, products: [] };
            }
          }

          setMessages((prev) => [...prev, { ...body, parsed }]);


          // Reset typing status
          if (body.guiTu === 1 || body.guiTu === 2) setTypingStatus("");

          // Cập nhật trạng thái nhân viên
          if (
            body.noiDung.includes(
              "Nhân viên đã tham gia chat, AI sẽ tạm dừng trả lời"
            )
          ) {
            setHasStaffJoined(true);
            // setTypingStatus("");
          }
          if (body.noiDung.includes("Nhân viên đã tham gia"))
            setHasStaffJoined(true);
          if (body.noiDung.includes("Nhân viên đã rời"))
            setHasStaffJoined(false);

            // setTypingStatus("");
          }
        }
      );
    });
  };

  const sendMessage = () => {
    if (!message.trim() || !roomId) return;

    const msg = message.trim();
    setMessage("");
    setTypingStatus(
      hasStaffJoined ? "Nhân viên đang trả lời" : "AI đang trả lời..."
    );

    stompClient.current.send(
      "/app/chat.send",
      {},
      JSON.stringify({ roomId, guiTu: 0, noiDung: msg })
    );
  };

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <>
      {/* Nút mở chat - đẹp lung linh */}
      {!open && (
        <div
          onClick={() => setOpen(true)}
          className="fixed bottom-20 cursor-pointer right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 text-white shadow-2xl flex items-center justify-center text-3xl hover:scale-110 transform transition-all duration-300 animate-pulse-slow"
        >
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
      )}

      {/* Chat box */}
      {open && (
        <div className="fixed bottom-20 right-6 w-96 max-w-[92vw] h-[580px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white p-3 flex justify-between items-start shadow-md">
            <div className="flex items-center gap-2">
              <div className="py-2 flex flex-col gap-2">
                <div className="font-bold text-lg">Hỗ trợ khách hàng</div>
                <div className="text-xs opacity-90">Xin chào {hoTen}!</div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition cursor-pointer"
            >
              ×
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white p-4 space-y-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${
                  m.guiTu === 0 ? "justify-end" : "justify-start"
                } items-end gap-2`}
              >
                {m.guiTu !== 0 && (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                    {m.guiTu === 1 ? "NV" : "AI"}
                  </div>
                )}

                <div
                  className={`max-w-[80%] ${m.guiTu === 0 ? "order-2" : ""}`}
                >
                  <div
                    className={`px-4 py-3 rounded-2xl shadow-md ${
                      m.guiTu === 0
                        ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-br-none"
                        : m.guiTu === 1
                        ? "bg-green-500 text-white rounded-bl-none"
                        : "bg-gray-700 text-white rounded-tl-none"
                    }`}
                  >
                    {m.guiTu !== 0 && (
                      <div className="text-xs font-medium opacity-80 mb-1">
                        {m.guiTu === 1 ? "Nhân viên hỗ trợ" : "AI Assistant"}
                      </div>
                    )}
                    <div className="text-sm leading-relaxed">
                      {m.parsed?.message || m.noiDung}
                    </div>

                    {/* Sản phẩm gợi ý */}
                    {m.parsed?.products?.length > 0 && (
                      <div className="mt-3 space-y-3">
                        {m.parsed.products.map((p) => (
                          <ProductCard key={p.id} product={p} />
                        ))}
                      </div>
                    )}

                    {/* Câu hỏi gợi ý */}
                    {m.parsed?.follow_up_question && (
                      <div className="mt-3 text-sm italic opacity-90 border-l-4 border-white/30 pl-3">
                        {m.parsed.follow_up_question}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator đẹp */}
            {typingStatus && (
              <div className="flex items-center gap-2 text-gray-500">
                <div className="flex space-x-1">
                  <span
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></span>
                  <span
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></span>
                  <span
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></span>
                </div>
                <span className="text-sm italic">{typingStatus}</span>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex gap-3">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !e.shiftKey && sendMessage()
                }
                placeholder="Aa..."
                className="flex-1 px-5 py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-4 focus:ring-orange-300 text-sm transition-all"
              />
              <button
                onClick={sendMessage}
                className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-6 py-3 rounded-full font-semibold hover:from-orange-600 hover:to-pink-600 transform hover:scale-105 transition-all shadow-lg"
              >
                Gửi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
