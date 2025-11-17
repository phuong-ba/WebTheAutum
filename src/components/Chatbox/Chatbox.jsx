import React, { useState, useRef, useEffect } from "react";
import SockJS from "sockjs-client";
import { over } from "stompjs";

let stompClient = null;

export default function Chatbox() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "ai", content: "Xin chào! Tôi có thể giúp gì cho bạn." },
  ]);
  const [input, setInput] = useState("");
  const [staffOnline, setStaffOnline] = useState(false);
  const chatBodyRef = useRef(null);

  const [roomId] = useState(() => {
    let id = sessionStorage.getItem("roomId");
    if (!id) {
      id = "room_" + Math.random().toString(36).substring(2, 10);
      sessionStorage.setItem("roomId", id);
    }
    return id;
  });

  useEffect(() => {
    const socket = new SockJS("http://localhost:8080/ws");
    stompClient = over(socket);

    stompClient.connect({}, () => {
      // Subscribe room khách
      stompClient.subscribe(`/topic/chat/${roomId}`, (msg) => {
        const message = JSON.parse(msg.body);

        if (message.sender === "system") {
          if (message.content.includes("đã vào")) setStaffOnline(true);
          if (message.content.includes("rời phòng")) setStaffOnline(false);
        }

        setMessages((prev) => [...prev, message]);
      });

      // Thông báo backend tạo room
      stompClient.send(
        `/app/chat.staff.join/${roomId}`,
        {},
        JSON.stringify({
          sender: "system",
          content: "Khách hàng đã vào phòng",
          roomId,
        })
      );
    });

    return () => {
      if (stompClient) stompClient.disconnect();
    };
  }, [roomId]);

  const handleSend = async (text) => {
    const userText = text || input.trim();
    if (!userText) return;
    setInput("");

    // Nếu có staff online, gửi trực tiếp
    if (staffOnline) {
      const msg = { roomId, sender: "user", content: userText };
      stompClient.send(`/app/chat.send/${roomId}`, {}, JSON.stringify(msg));
      setMessages((prev) => [...prev, msg]);
      return;
    }

    // Hiển thị "đang trả lời" trước khi AI trả về
    setMessages((prev) => [
      ...prev,
      { sender: "user", content: userText },
      { sender: "ai", content: "Đang trả lời..." },
    ]);

    try {
      const res = await fetch("http://localhost:8080/api/chatbot/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, roomId }),
      });
      const data = await res.json();

      // Backend trả về JSON array / object, format gọn
      let replyText = "";
      if (data.products) {
        replyText = data.products
          .map((p) => `- ${p.name}: ${p.price}`)
          .join("\n");
      } else if (data.vouchers) {
        replyText = data.vouchers
          .map((v) => `- ${v.name} giảm ${v.discountPercent}%`)
          .join("\n");
      } else {
        replyText = data.reply ?? "Xin lỗi, tôi không có câu trả lời.";
      }

      // Cập nhật message
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { sender: "ai", content: replyText },
      ]);

      // Gửi AI message lên WS cho staff
      stompClient.send(
        `/app/chat.send/${roomId}`,
        {},
        JSON.stringify({ sender: "ai", content: replyText, roomId })
      );
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { sender: "ai", content: "Có lỗi xảy ra 😢" },
      ]);
    }
  };

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTo({
        top: chatBodyRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  return (
    <>
      {/* Chat button */}
      <div
        className="fixed bottom-5 right-6 cursor-pointer z-[1000] hover:scale-110 transition-transform"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
          Chat
        </div>
      </div>

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 w-[400px] h-[600px] bg-white rounded-3xl shadow-xl flex flex-col overflow-hidden z-[1001]">
          {/* Header */}
          <div className="bg-white shadow-md p-5 flex justify-between items-center rounded-t-3xl">
            <div className="font-semibold text-gray-700 text-lg">
              ChatBot {staffOnline && "(Nhân viên online)"}
            </div>
            <button onClick={() => setIsOpen(false)}>X</button>
          </div>

          {/* Chat body */}
          <div
            ref={chatBodyRef}
            className="flex-1 p-5 flex flex-col gap-2 overflow-y-auto"
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`px-3 py-2 rounded-xl whitespace-pre-wrap ${
                    msg.sender === "user"
                      ? "bg-blue-400 text-white"
                      : msg.sender === "ai"
                      ? "bg-yellow-100"
                      : "bg-gray-200"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <form
            className="flex p-3 border-t border-gray-200 gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              type="text"
              className="flex-1 border px-3 py-2 rounded-xl"
              placeholder="Nhập tin nhắn..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button className="bg-blue-500 text-white px-4 py-2 rounded-xl">
              Gửi
            </button>
          </form>
        </div>
      )}
    </>
  );
}
