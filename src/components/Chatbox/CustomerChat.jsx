import React, { useState, useEffect, useRef } from "react";
import SockJS from "sockjs-client";
import { over } from "stompjs";

export default function CustomerChat() {
  const [customerId] = useState(localStorage.getItem("customer_id"));
  const [hoTen] = useState(
    localStorage.getItem("customer_name") || "Khách hàng"
  );
  const [roomId, setRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");

  const stompClient = useRef(null);
  const subscriptionRef = useRef(null);
  const bottomRef = useRef();
  const [hasStaffJoined, setHasStaffJoined] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!customerId) {
      alert("Vui lòng đăng nhập trước khi chat!");
      window.location.href = "/login";
      return;
    }

    const loadRoom = async () => {
      const res = await fetch(
        `http://localhost:8080/api/chatbot/rooms/by-customer/${customerId}`
      );
      const data = await res.json();
      setRoomId(data.roomId);
      connectWS(data.roomId);
      loadHistory(data.roomId);
    };
    loadRoom();

    return () => {
      subscriptionRef.current?.unsubscribe();
      stompClient.current?.disconnect();
    };
  }, [customerId]);

  const loadHistory = async (rid) => {
    const res = await fetch(`http://localhost:8080/api/chatbot/history/${rid}`);
    const data = await res.json();
    setMessages(data);
  };

  const connectWS = (rid) => {
    const sock = new SockJS(
      "[http://localhost:8080/ws](http://localhost:8080/ws)"
    );
    stompClient.current = over(sock);

    if (!stompClient.current) return;

    stompClient.current.connect({}, () => {
      subscriptionRef.current = stompClient.current.subscribe(
        `/topic/chat/${rid}`,
        (msg) => {
          const body = JSON.parse(msg.body);
          setMessages((prev) => [...prev, body]);
          if (
            body.noiDung.includes(
              "Nhân viên đã tham gia chat, AI sẽ tạm dừng trả lời"
            )
          ) {
            setHasStaffJoined(true);
          }
        }
      );
    });
  };

  const sendMessage = () => {
    if (!message.trim() || !roomId) return;
    const msg = message;
    setMessage("");

    stompClient.current.send(
      "/app/chat.send",
      {},
      JSON.stringify({ roomId, guiTu: 0, noiDung: msg })
    );
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <>
      {!open && (
        <button
          className="fixed bottom-15 right-15 w-14 h-14 rounded-full bg-yellow-500 text-white shadow-lg flex items-center justify-center text-2xl hover:bg-yellow-600 transition"
          onClick={() => setOpen(true)}
        >
          💬{" "}
        </button>
      )}

      {open && (
        <div className="fixed bottom-25 right-15 w-96 max-w-[90%] flex flex-col rounded-xl shadow-lg overflow-hidden bg-white">
          {/* Header */}
          <div className="bg-yellow-500 text-white font-bold px-4 py-2 flex justify-between items-center">
            Chat hỗ trợ - {hoTen}
            <button
              onClick={() => setOpen(false)}
              className="ml-2 text-white font-bold text-lg"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div
            className="flex-1 p-4 bg-gray-100 overflow-y-auto flex flex-col gap-2"
            style={{ maxHeight: "400px" }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${
                  m.guiTu === 0 ? "justify-end" : "justify-start"
                } items-end`}
              >
                {m.guiTu !== 0 && (
                  <div className="w-6 h-6 rounded-full bg-gray-300 text-xs flex items-center justify-center mr-2">
                    {m.guiTu === 1 ? "NV" : "AI"}
                  </div>
                )}
                <div
                  className={`max-w-[70%] px-3 py-1 rounded-2xl break-words ${
                    m.guiTu === 0
                      ? "bg-yellow-500 text-white text-right"
                      : m.guiTu === 1
                      ? "bg-green-400 text-white"
                      : "bg-blue-400 text-white"
                  }`}
                >
                  {m.guiTu === 0 ? (
                    <>
                      <span className="text-[14px] font-semibold">
                        {m.noiDung}:
                      </span>{" "}
                      <span className="text-sm font-normal">Bạn</span>
                    </>
                  ) : (
                    <>
                      <span className="text-[14px] font-semibold">
                        {m.guiTu === 1 ? "Nhân viên" : "AI"}:
                      </span>{" "}
                      <span className="text-sm font-normal">{m.noiDung}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef}></div>
          </div>

          {/* Input */}
          <div className="flex p-2 border-t border-gray-300 gap-2 bg-white">
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
        </div>
      )}
    </>
  );
}
