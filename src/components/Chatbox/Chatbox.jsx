import React, { useState, useEffect, useRef } from "react";
import SockJS from "sockjs-client";
import { over } from "stompjs";

let stompClient = null;

export default function Chatbox() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("ai"); // ai hoặc staff
  const [sending, setSending] = useState(false);
  const chatRef = useRef(null);

  const [roomId] = useState(() => {
    let id = sessionStorage.getItem("maKhachHang");
    if (!id) {
      id = "guest_" + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem("maKhachHang", id);
    }
    return id;
  });

  // Load lịch sử chat
  useEffect(() => {
    fetch(`http://localhost:8080/api/chatbot/history/${roomId}`)
      .then((res) => res.json())
      .then((data) => setMessages(data))
      .catch(console.error);
  }, [roomId]);

  // Kết nối WebSocket
  useEffect(() => {
    const socket = new SockJS("http://localhost:8080/ws");
    stompClient = over(socket);

    stompClient.connect({}, () => {
      // Subscribe topic
      stompClient.subscribe(`/topic/chat/${roomId}`, (msg) => {
        const data = JSON.parse(msg.body);
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev; // deduplicate
          return [...prev, data];
        });
      });

      // Gửi message hệ thống khi tạo phòng
      stompClient.send(
        `/app/chat.send/${roomId}`,
        {},
        JSON.stringify({
          phongId: roomId,
          nguoiGui: "system",
          role: "system",
          noiDung: "Phòng chat khách được tạo",
        })
      );
    });

    return () => stompClient?.disconnect();
  }, [roomId]);

  // Chọn AI hoặc Staff
  const chooseAssistant = (type) => {
    setMode(type);
    stompClient.send(
      `/app/chat.send/${roomId}`,
      {},
      JSON.stringify({
        phongId: roomId,
        nguoiGui: "system",
        role: "system",
        noiDung:
          type === "ai"
            ? "Khách chuyển sang chat với AI"
            : "Khách chuyển sang chat với nhân viên",
      })
    );
  };

  // Gửi message
  const sendMsg = async () => {
    if (!input.trim()) return;
    const msgContent = input;
    setInput("");
    setSending(true);

    const userMsg = {
      phongId: roomId,
      nguoiGui: "customer",
      role: "customer",
      noiDung: msgContent,
    };

    setMessages((prev) => [...prev, userMsg]);

    if (mode === "ai") {
      try {
        const res = await fetch("http://localhost:8080/api/chatbot/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: msgContent, roomId }),
        });
        const data = await res.json();
        const aiMsg = {
          phongId: roomId,
          nguoiGui: "ai",
          role: "ai",
          noiDung: data.reply || "Xin lỗi, tôi không tìm thấy câu trả lời.",
        };
        stompClient.send(`/app/chat.send/${roomId}`, {}, JSON.stringify(aiMsg));
      } catch {
        const errMsg = {
          phongId: roomId,
          nguoiGui: "ai",
          role: "ai",
          noiDung: "AI đang gặp lỗi, thử lại sau.",
        };
        stompClient.send(
          `/app/chat.send/${roomId}`,
          {},
          JSON.stringify(errMsg)
        );
      }
    } else {
      stompClient.send(`/app/chat.send/${roomId}`, {}, JSON.stringify(userMsg));
    }
    setSending(false);
  };

  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const renderMessage = (m, i) => {
    let bg = "bg-gray-100 text-gray-800";
    if (m.role === "customer") bg = "bg-blue-600 text-white";
    else if (m.role === "ai") bg = "bg-green-100 text-green-800";
    else if (m.role === "staff" || m.role === "admin")
      bg = "bg-yellow-100 text-yellow-800";
    else if (m.role === "system") bg = "bg-gray-200 text-gray-600 italic";

    return (
      <div
        key={i}
        className={`flex ${
          m.role === "customer" ? "justify-end" : "justify-start"
        }`}
      >
        <div className={`px-3 py-2 rounded-xl max-w-[70%] break-words ${bg}`}>
          {m.noiDung}
        </div>
      </div>
    );
  };

  return (
    <>
      <button
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg"
        onClick={() => setIsOpen(true)}
      >
        Chat
      </button>
      {isOpen && (
        <div className="fixed bottom-20 right-6 w-[420px] h-[600px] bg-white shadow-2xl rounded-2xl flex flex-col">
          <div className="border-b p-3 text-center text-sm text-gray-600">
            Chọn trợ lý để trò chuyện
            <div className="flex justify-center gap-8 mt-3">
              <div
                className="flex flex-col items-center cursor-pointer"
                onClick={() => chooseAssistant("ai")}
              >
                <img
                  src="/ai_logo.png"
                  className="w-14 h-14 rounded-full border-2 border-blue-400"
                />
                <span className="text-xs mt-1">AI</span>
              </div>
              <div
                className="flex flex-col items-center cursor-pointer"
                onClick={() => chooseAssistant("staff")}
              >
                <img
                  src="/staff_avatar.png"
                  className="w-14 h-14 rounded-full border"
                />
                <span className="text-xs mt-1">Nhân viên</span>
              </div>
            </div>
          </div>
          <div
            ref={chatRef}
            className="flex-1 p-3 overflow-y-auto space-y-3 bg-gray-50"
          >
            {messages.map(renderMessage)}
          </div>
          <div className="p-3 border-t flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập nội dung chat..."
              className="flex-1 border rounded-xl px-3 py-2"
              onKeyDown={(e) => e.key === "Enter" && sendMsg()}
              disabled={sending}
            />
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-xl"
              onClick={sendMsg}
              disabled={sending}
            >
              ➤
            </button>
          </div>
          <div className="text-center text-xs p-2 text-gray-400">
            Thông tin mang tính tham khảo
          </div>
        </div>
      )}
    </>
  );
}
