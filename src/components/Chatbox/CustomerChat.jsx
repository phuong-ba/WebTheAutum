import React, { useState, useEffect, useRef } from "react";
import SockJS from "sockjs-client";
import { over } from "stompjs";
import { useNavigate } from "react-router-dom";

// Component hiển thị sản phẩm
function ProductCard({ product }) {
  const productLink = `http://localhost:5173/productDetail/${product.id}`;

  return (
    <div className="flex flex-col border rounded-xl p-2 gap-2 bg-white shadow hover:shadow-lg transition">
      <a href={productLink} target="_blank" rel="noopener noreferrer">
        <div className="flex gap-1">
          {(product.hinhAnhSanPham?.length
            ? product.hinhAnhSanPham
            : ["/placeholder.png"]
          ).map((img, idx) => (
            <img
              key={idx}
              src={img || "/placeholder.png"}
              alt={product.tenSanPham || product.name}
              className="w-16 h-16 object-cover rounded"
            />
          ))}
        </div>
      </a>
      <div className="flex flex-col justify-between">
        <div className="font-semibold text-sm text-gray-600">
          {product.tenSanPham || product.name}
        </div>
        <div className="text-yellow-600 font-bold">
          {(product.price || 0).toLocaleString()}₫
        </div>
        {product.color && (
          <div className="text-gray-500 text-xs">Màu: {product.color}</div>
        )}
        {product.size_suggestion && (
          <div className="text-gray-500 text-xs">
            Size gợi ý: {product.size_suggestion}
          </div>
        )}
        <a
          href={productLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-medium px-3 py-1 rounded text-center transition"
        >
          Mua Ngay
        </a>
      </div>
    </div>
  );
}

// Main chat component
export default function CustomerChat() {
  const [customerId, setCustomerId] = useState(
    localStorage.getItem("customer_id")
  );
  const [hoTen, setHoTen] = useState(
    localStorage.getItem("customer_name") || "Khách hàng"
  );
  const [roomId, setRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [typingStatus, setTypingStatus] = useState("");
  const [hasStaffJoined, setHasStaffJoined] = useState(false);
  const [open, setOpen] = useState(false);

  const stompClient = useRef(null);
  const subscriptionRef = useRef(null);
  const bottomRef = useRef();
  const navigate = useNavigate();

  // Load room + connect WS
  useEffect(() => {
    if (!open) return;

    const loadRoom = async () => {
      try {
        let data;
        if (customerId) {
          // Khách đăng nhập
          const res = await fetch(
            `http://localhost:8080/api/chatbot/rooms/by-customer/${customerId}`
          );
          data = await res.json();
          setHoTen(localStorage.getItem("customer_name") || "Khách hàng");
        } else {
          // Khách lẻ
          const res = await fetch(
            `http://localhost:8080/api/chatbot/rooms/guest`
          );
          data = await res.json();
          setHoTen("Khách lẻ");
        }

        setRoomId(data.roomId);
        connectWS(data.roomId);
        loadHistory(data.roomId);
      } catch (e) {
        console.error(e);
      }
    };

    loadRoom();

    return () => {
      subscriptionRef.current?.unsubscribe();
      stompClient.current?.disconnect();
    };
  }, [open, customerId]);

  // Load history messages
  const loadHistory = async (rid) => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/chatbot/history/${rid}`
      );
      const data = await res.json();
      const messagesParsed = (
        Array.isArray(data) ? data : data?.messages || []
      ).map((m) => {
        if (m.guiTu === 2) {
          try {
            return { ...m, parsed: JSON.parse(m.noiDung) };
          } catch {
            return {
              ...m,
              parsed: {
                message: m.noiDung,
                products: [],
                follow_up_question: "",
                need_human_support: false,
              },
            };
          }
        }
        return m;
      });
      setMessages(messagesParsed);
    } catch (e) {
      console.error(e);
    }
  };

  // Send message
  const sendMessage = () => {
    if (!message.trim() || !roomId) return;
    const msg = message;
    setMessage("");

    setTypingStatus(
      !hasStaffJoined ? "AI: đang trả lời" : "Nhân viên: đang trả lời"
    );

    stompClient.current.send(
      "/app/chat.send",
      {},
      JSON.stringify({ roomId, guiTu: 0, noiDung: msg })
    );
  };

  // Connect WebSocket
  const connectWS = (rid) => {
    const sock = new SockJS("http://localhost:8080/ws");
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
              parsed = {
                message: body.noiDung,
                products: [],
                follow_up_question: "",
                need_human_support: false,
              };
            }
          }

          setMessages((prev) => [...prev, { ...body, parsed }]);

          // Reset typing status
          if (body.guiTu === 1 || body.guiTu === 2)
            setTimeout(() => setTypingStatus(""), 1500);

          // Cập nhật trạng thái nhân viên
          if (
            body.noiDung.includes(
              "Nhân viên đã tham gia chat, AI sẽ tạm dừng trả lời"
            )
          ) {
            setHasStaffJoined(true);
            setTimeout(() => setTypingStatus(""), 1500);
          }
          if (
            body.noiDung.includes("Nhân viên đã rời, AI sẽ tiếp tục hỗ trợ bạn")
          ) {
            setHasStaffJoined(false);
            setTimeout(() => setTypingStatus(""), 1500);
          }
        }
      );
    });
  };

  // Scroll xuống cuối chat
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <>
      {!open && (
        <button
          className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-yellow-500 text-white shadow-xl flex items-center justify-center text-3xl hover:bg-yellow-600 transition"
          onClick={() => {
            const id = localStorage.getItem("customer_id");
            const name = localStorage.getItem("customer_name");
            setCustomerId(id); // id có thể null
            setHoTen(name || "Khách lẻ");
            setOpen(true);
            // if (!id) navigate("/customer/login"); // hoặc cho phép khách lẻ chat
          }}
        >
          💬
        </button>
      )}

      {open && (
        <div
          className="fixed bottom-6 right-6 w-96 max-w-[90%] flex flex-col rounded-2xl shadow-2xl overflow-hidden bg-white border border-gray-200"
          style={{ height: "550px" }}
        >
          {/* Header */}
          <div className="bg-yellow-500 text-white font-bold px-4 py-3 flex justify-between items-center text-[17px]">
            Chat hỗ trợ - {hoTen}
            <button
              onClick={() => setOpen(false)}
              className="ml-2 text-white font-bold text-xl"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 bg-gray-100 overflow-y-auto flex flex-col gap-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${
                  m.guiTu === 0 ? "justify-end" : "justify-start"
                } items-end`}
              >
                {m.guiTu !== 0 && (
                  <div className="w-7 h-7 rounded-full bg-gray-300 text-xs flex items-center justify-center mr-2">
                    {m.guiTu === 1 ? "NV" : "AI"}
                  </div>
                )}
                <div
                  className={`max-w-[75%] px-3 py-2 rounded-2xl shadow-sm break-words ${
                    m.guiTu === 0
                      ? "bg-yellow-500 text-white text-right"
                      : m.guiTu === 1
                      ? "bg-green-400 text-white"
                      : "bg-blue-400 text-white"
                  }`}
                >
                  {m.guiTu === 0 ? (
                    <span className="text-[14px] font-semibold">
                      {m.noiDung}
                    </span>
                  ) : (
                    <>
                      <span className="text-[13px] font-semibold">
                        {m.guiTu === 1 ? "Nhân viên" : "AI"}:{" "}
                      </span>
                      <span className="text-sm font-normal">
                        {m.parsed?.message || m.noiDung}
                      </span>
                      {m.parsed?.products?.length > 0 && (
                        <div className="flex flex-col gap-2 mt-2">
                          {m.parsed.products.map((p) => (
                            <ProductCard
                              key={p.id}
                              product={{
                                id: p.id,
                                tenSanPham:
                                  p.tenSanPham || p.name || "Sản phẩm",
                                hinhAnhSanPham:
                                  p.hinhAnhSanPham ||
                                  (p.image ? [p.image] : []),
                                price: p.price || 0,
                                color: p.color || "",
                                size_suggestion: p.size_suggestion || "",
                                link: p.link || `/productDetail/${p.id}`,
                              }}
                            />
                          ))}
                        </div>
                      )}
                      {m.parsed?.follow_up_question && (
                        <div className="mt-2 text-white-700 text-sm font-medium">
                          {m.parsed.follow_up_question}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}

            {typingStatus && (
              <div className="text-gray-500 italic text-sm mt-1 ml-2 flex items-center gap-1">
                <span>{typingStatus}</span>
                <span className="animate-pulse">...</span>
              </div>
            )}

            <div ref={bottomRef}></div>
          </div>

          {/* Input */}
          <div className="flex p-3 border-t border-gray-300 bg-white gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Nhập tin nhắn..."
              className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            <button
              onClick={sendMessage}
              className="bg-yellow-500 text-white px-5 py-2 rounded-full font-semibold hover:bg-yellow-600 transition"
            >
              Gửi
            </button>
          </div>
        </div>
      )}
    </>
  );
}
