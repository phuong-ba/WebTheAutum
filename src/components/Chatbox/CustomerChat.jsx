import React, { useState, useEffect, useRef } from "react";
import SockJS from "sockjs-client";
import { over } from "stompjs";
import { useNavigate } from "react-router-dom";
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
  const stompClient = useRef(null);
  const subscriptionRef = useRef(null);
  const bottomRef = useRef();
  const [hasStaffJoined, setHasStaffJoined] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!customerId) return; // Nếu chưa login thì không load chat

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
    setMessages(Array.isArray(data) ? data : data?.messages || []);
    console.log(data);
  };
  const sendMessage = () => {
    if (!message.trim() || !roomId) return;
    const msg = message;
    setMessage("");

    if (!hasStaffJoined) setTypingStatus("AI: đang trả lời");
    else setTypingStatus("Nhân viên: đang trả lời");

    stompClient.current.send(
      "/app/chat.send",
      {},
      JSON.stringify({ roomId, guiTu: 0, noiDung: msg })
    );
  };

  const connectWS = (rid) => {
    const sock = new SockJS("http://localhost:8080/ws");
    stompClient.current = over(sock);

    if (!stompClient.current) return;

    stompClient.current.connect({}, () => {
      subscriptionRef.current = stompClient.current.subscribe(
        `/topic/chat/${rid}`,
        (msg) => {
          const body = JSON.parse(msg.body);

          setMessages((prev) => [...prev, body]);

          if (body.guiTu === 1 || body.guiTu === 2) {
            setTypingStatus("");
            setTimeout(() => setTypingStatus(""), 1500);
          }

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

            if (!id) {
              navigate("/customer/login");
              return;
            }

            setCustomerId(id);
            setHoTen(name || "Khách hàng");
            setOpen(true);
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

          {/* Messages area */}
          <div
            className="flex-1 p-4 bg-gray-100 overflow-y-auto flex flex-col gap-3"
            style={{ maxHeight: "100%" }}
          >
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
                    <>
                      <span className="text-[14px] font-semibold">
                        {m.noiDung}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[13px] font-semibold">
                        {m.guiTu === 1 ? "Nhân viên" : "AI"}:
                      </span>{" "}
                      <span className="text-sm font-normal">{m.noiDung}</span>
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

          {/* Input area */}
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
