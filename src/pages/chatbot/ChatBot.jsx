import chatApi from "@/api/history";
import React, { useState, useEffect, useRef } from "react";
import SockJS from "sockjs-client";
import { over } from "stompjs";

function ProductCard({ product }) {
  const linkPro = import.meta.env.VITE_LINK_URL;
  const productLink = `${linkPro}/productDetail/${product.id}`;

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
      </div>
    </div>
  );
}

// Main Admin Chat component
export default function AdminChat() {
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [typingStatus, setTypingStatus] = useState("");
  const [hasStaffJoined, setHasStaffJoined] = useState(false);
  const [loading, setLoading] = useState(false);

  const stompClient = useRef(null);
  const subscriptionRef = useRef(null);
  const bottomRef = useRef();
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  // Load tất cả phòng chat
  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await chatApi.getAllRooms();
      setRooms(response.data?.rooms || []);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  };

  // Khi chọn phòng
  const joinRoom = async (room) => {
    try {
      setCurrentRoom(room);
      setMessages([]);
      setLoading(true);

      // Tham gia phòng
      await chatApi.joinRoom(room.roomId, 1);

      // Kết nối WebSocket
      connectWS(room.roomId);

      // Tải lịch sử chat
      await loadHistory(room.roomId);
    } catch (error) {
      console.error("Error joining room:", error);
    } finally {
      setLoading(false);
    }
  };

  // Rời phòng
  const leaveRoom = async () => {
    if (!currentRoom) return;

    try {
      await chatApi.leaveRoom(currentRoom.roomId, 1);

      if (subscriptionRef.current) subscriptionRef.current.unsubscribe();
      if (stompClient.current) stompClient.current.disconnect();

      setCurrentRoom(null);
      setMessages([]);
      setHasStaffJoined(false);
    } catch (error) {
      console.error("Error leaving room:", error);
    }
  };

  const loadHistory = async (roomId) => {
    try {
      const response = await chatApi.getChatHistory(roomId);
      const data = response.data;

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

  const connectWS = (rid) => {
    if (stompClient.current) {
      if (subscriptionRef.current) subscriptionRef.current.unsubscribe();
      stompClient.current.disconnect();
    }

    const sock = new SockJS(apiBaseUrl);
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

  // Gửi tin nhắn
  const sendMessage = async () => {
    if (!message.trim() || !currentRoom) return;
    const msg = message;
    setMessage("");

    setTypingStatus(
      !hasStaffJoined ? "AI: đang trả lời" : "Nhân viên: đang trả lời"
    );

    try {
      await chatApi.sendMessage(currentRoom.roomId, msg, 1);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Scroll xuống cuối chat
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-screen gap-4 p-4 bg-gray-100">
      {/* Sidebar phòng */}
      <div className="w-64 bg-white shadow rounded-lg overflow-y-auto">
        <h3 className="font-bold text-lg p-4 border-b">Phòng Chat</h3>
        {rooms.map((r) => (
          <div
            key={r.roomId}
            className="p-3 m-2 cursor-pointer border rounded hover:bg-yellow-100 transition"
            onClick={() => joinRoom(r)}
          >
            <span className="font-semibold">{r.khachHang}</span> (
            {r.loai === 0 ? "AI" : "Nhân viên"})
          </div>
        ))}
      </div>

      {/* Khu chat */}
      <div className="flex-1 flex flex-col bg-white shadow rounded-lg">
        <div className="bg-yellow-500 text-white font-bold px-4 py-2 flex justify-between items-center rounded-t-lg">
          Chat với {currentRoom?.khachHang || "Chọn phòng"}
          {currentRoom && (
            <button
              onClick={leaveRoom}
              className="bg-red-500 px-2 py-1 rounded hover:bg-red-600 transition"
            >
              Rời phòng
            </button>
          )}
        </div>

        <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-2">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${
                m.guiTu === 1 ? "justify-end" : "justify-start"
              } items-end`}
            >
              {m.guiTu !== 1 && (
                <div className="w-6 h-6 rounded-full bg-gray-300 text-xs flex items-center justify-center mr-2">
                  {m.guiTu === 0 ? "KH" : "AI"}
                </div>
              )}

              <div
                className={`max-w-[70%] px-3 py-2 rounded-2xl break-words ${
                  m.guiTu === 1
                    ? "bg-green-400 text-white text-right"
                    : m.guiTu === 0
                    ? "bg-yellow-500 text-white"
                    : "bg-blue-400 text-white"
                }`}
              >
                {m.guiTu === 1 ? (
                  <span className="text-sm">{m.noiDung}</span>
                ) : (
                  <>
                    <span className="text-[10px] font-semibold">
                      {m.guiTu === 0 ? "Khách" : "AI"}:
                    </span>{" "}
                    <span className="text-sm">
                      {m.parsed?.message || m.noiDung}
                    </span>
                    {m.parsed?.products?.length > 0 && (
                      <div className="flex flex-col gap-2 mt-2">
                        {m.parsed.products.map((p) => (
                          <ProductCard
                            key={p.id}
                            product={{
                              id: p.id,
                              tenSanPham: p.tenSanPham || p.name || "Sản phẩm",
                              hinhAnhSanPham:
                                p.hinhAnhSanPham || (p.image ? [p.image] : []),
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

        {currentRoom && (
          <div className="flex p-2 border-t border-gray-300 gap-2 bg-white rounded-b-lg">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Nhập tin nhắn..."
              className="flex-1 border border-gray-300 rounded-full px-3 py-1 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <button
              onClick={sendMessage}
              className="bg-yellow-500 text-white px-4 py-1 rounded-full hover:bg-yellow-600 transition-colors"
            >
              Gửi
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
