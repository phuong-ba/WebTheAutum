import React, { useState, useEffect, useRef } from "react";
import SockJS from "sockjs-client";
import { over } from "stompjs";

let stompClient = null;

export default function Chatbox() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("ai"); // ai hoặc staff
  const [showAssistantChooser, setShowAssistantChooser] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const chatRef = useRef(null);

  const [roomId] = useState(() => {
    let id = sessionStorage.getItem("roomId");
    if (!id) {
      id = "room_" + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem("roomId", id);
    }
    return id;
  });

  // Kết nối WebSocket khi mount
  useEffect(() => {
    const socket = new SockJS("http://localhost:8080/ws");
    stompClient = over(socket);

    stompClient.connect({}, () => {
      // Subscribe room của khách hàng
      stompClient.subscribe(`/topic/chat/${roomId}`, (msg) => {
        const data = JSON.parse(msg.body);
        setMessages((prev) => [...prev, data]);
      });

      // Khởi tạo phòng mới nếu chưa có
      stompClient.send(
        `/app/chat.init/${roomId}`,
        {},
        JSON.stringify({
          sender: "user",
          content: "Phòng mới",
          type: "new_room",
          roomId,
        })
      );
    });

    return () => stompClient?.disconnect();
  }, [roomId]);

  // Gửi tin nhắn
  const sendMsg = async () => {
    if (!input.trim()) return;

    const msgContent = input;
    const userMsg = {
      sender: "user",
      content: msgContent,
      type: "user",
      roomId,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    if (mode === "ai") {
      // Gọi REST API AI
      try {
        const res = await fetch("http://localhost:8080/api/chatbot/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: msgContent, roomId }),
        });
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          { sender: "ai", content: data.reply, type: "ai_reply" },
        ]);
      } catch (err) {
        console.error(err);
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            content: "AI đang gặp lỗi, thử lại sau.",
            type: "ai_reply",
          },
        ]);
      }
    } else {
      // Mode staff: gửi qua WebSocket
      stompClient.send(`/app/chat.send/${roomId}`, {}, JSON.stringify(userMsg));
    }
  };

  // Yêu cầu nhân viên hỗ trợ
  const requestStaff = () => {
    stompClient.send(
      `/app/chat.requestStaff/${roomId}`,
      {},
      JSON.stringify({
        roomId,
        type: "new_room",
      })
    );
    setMode("staff");
    setShowAssistantChooser(false);
  };

  // Scroll xuống cuối khi có message mới
  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const chooseAssistant = (type) => {
    if (type === "staff") requestStaff();
    else {
      setMode("ai");
      setShowAssistantChooser(false);
      setShowDropdown(false);
    }
  };

  const renderMessage = (m, i) => {
    let bg = "bg-gray-100 text-gray-800";
    if (m.sender === "user") bg = "bg-blue-600 text-white";
    else if (m.type === "ai_reply") bg = "bg-green-100 text-green-800";
    else if (m.type === "staff_status")
      bg = "bg-yellow-100 text-yellow-800 italic";
    else if (m.type === "new_room") bg = "bg-gray-200 text-gray-600 italic";

    return (
      <div
        key={i}
        className={`flex ${
          m.sender === "user" ? "justify-end" : "justify-start"
        }`}
      >
        <div className={`px-3 py-2 rounded-xl max-w-[70%] break-words ${bg}`}>
          {m.content}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Button mở chat */}
      <button
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg"
        onClick={() => setIsOpen(true)}
      >
        Chat
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-6 w-[420px] h-[600px] bg-white shadow-2xl rounded-2xl flex flex-col">
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b cursor-pointer relative"
            onClick={() =>
              !showAssistantChooser && setShowDropdown(!showDropdown)
            }
          >
            <div className="flex items-center gap-2">
              <img
                src="/ai_logo.png"
                alt="AI"
                className="w-9 h-9 rounded-full"
              />
              <div className="flex flex-col leading-tight">
                <span className="font-semibold flex items-center gap-1">
                  {mode === "ai" ? "Trợ lý AI" : "Trợ lý Cá Nhân"}
                  <span
                    className={`inline-block transform transition-transform duration-300 ${
                      showDropdown ? "rotate-0" : "rotate-180"
                    }`}
                  >
                    ⌄
                  </span>
                </span>
                <span className="text-xs text-gray-500">Đang hoạt động</span>
              </div>
            </div>
            <button
              className="text-2xl"
              onClick={() => {
                setIsOpen(false);
                setShowDropdown(false);
              }}
            >
              ×
            </button>

            {/* Dropdown chọn trợ lý */}
            {!showAssistantChooser && showDropdown && (
              <div className="absolute top-[60px] left-0 w-full bg-white border rounded-xl shadow-lg p-4 z-10">
                <div
                  className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
                  onClick={() => chooseAssistant("ai")}
                >
                  <img src="/ai_logo.png" className="w-10 h-10 rounded-full" />
                  <span className="text-sm font-medium">Hỏi Trợ Lý AI</span>
                </div>
                <div
                  className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg cursor-pointer mt-2"
                  onClick={() => chooseAssistant("staff")}
                >
                  <img
                    src="/staff_avatar.png"
                    className="w-10 h-10 rounded-full"
                  />
                  <span className="text-sm font-medium">
                    Hỏi Trợ Lý Cá Nhân
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Chọn trợ lý lần đầu */}
          {showAssistantChooser && (
            <div className="border-b p-3 text-center text-sm text-gray-600">
              Chọn trợ lý bạn muốn trò chuyện
              <div className="flex justify-center gap-8 mt-3">
                <div
                  className="flex flex-col items-center cursor-pointer"
                  onClick={() => chooseAssistant("ai")}
                >
                  <img
                    src="/ai_logo.png"
                    className="w-14 h-14 rounded-full border-2 border-blue-400"
                  />
                  <span className="text-xs mt-1">Hỏi Trợ Lý AI</span>
                </div>
                <div
                  className="flex flex-col items-center cursor-pointer"
                  onClick={() => chooseAssistant("staff")}
                >
                  <img
                    src="/staff_avatar.png"
                    className="w-14 h-14 rounded-full border"
                  />
                  <span className="text-xs mt-1">Hỏi Trợ Lý Cá Nhân</span>
                </div>
              </div>
            </div>
          )}

          {/* Chat messages */}
          <div
            ref={chatRef}
            className="flex-1 p-3 overflow-y-auto space-y-3 bg-gray-50"
          >
            {!showAssistantChooser && messages.map(renderMessage)}
          </div>

          {/* Input */}
          {!showAssistantChooser && (
            <div className="p-3 border-t flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 border rounded-xl px-3 py-2"
                placeholder="Nhập nội dung chat..."
                onKeyDown={(e) => e.key === "Enter" && sendMsg()}
              />
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-xl"
                onClick={sendMsg}
              >
                ➤
              </button>
            </div>
          )}

          <div className="text-center text-xs p-2 text-gray-400">
            Tích hợp trí tuệ nhân tạo, thông tin mang tính tham khảo
          </div>
        </div>
      )}
    </>
  );
}
