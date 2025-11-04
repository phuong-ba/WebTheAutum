import React, { useState, useRef, useEffect } from "react";
import SockJS from "sockjs-client";
import { over } from "stompjs";

import bot from "@/assets/iconchat/bot.png";
import ellipse from "@/assets/iconchat/Ellipse 318.png";
import refresh from "@/assets/iconchat/refresh-2.png";
import minus from "@/assets/iconchat/minus.png";
import sendIcon from "@/assets/iconchat/send-2.png";
import frame from "@/assets/iconchat/Frame 42500.png";

let stompClient = null;

export default function Chatbox() {
  const [isOpen, setIsOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Xin chào! Tôi là trợ lý ảo của Rikkei Education. Tôi có thể giúp gì cho bạn?",
    },
  ]);
  const [input, setInput] = useState("");
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);
  const [roomId] = useState("default");
  const chatBodyRef = useRef(null);

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && !connected) {
      const socket = new SockJS("http://localhost:8080/ws");
      stompClient = over(socket);
      stompClient.connect({}, onConnected, onError);
    }
  }, [isOpen]);

  const onConnected = () => {
    console.log("✅ WebSocket Connected!");
    setConnected(true);
    stompClient.subscribe(`/topic/${roomId}`, (msg) => {
      const body = JSON.parse(msg.body);
      const sender =
        body.role === "admin" || body.sender === "bot" ? "bot" : "user";
      setMessages((prev) => [
        ...prev,
        { sender, text: body.content || body.message },
      ]);
    });
  };

  const onError = (err) => {
    console.error("❌ WebSocket Error:", err);
  };

  const handleSend = () => {
    const msg = input.trim();
    if (!msg || !stompClient) return;
    const chatMessage = {
      sender: "Khách hàng",
      content: msg,
      role: "customer",
      roomId,
    };
    setMessages((prev) => [...prev, { sender: "user", text: msg }]);
    setInput("");
    stompClient.send("/app/sendMessage", {}, JSON.stringify(chatMessage));
  };

  const handleSuggestionClick = (msg) => {
    setSuggestionsVisible(false);
    setInput(msg);
    handleSend();
  };

  const reloadChat = () => {
    setMessages([
      {
        sender: "bot",
        text: "Xin chào! Tôi là trợ lý ảo của Rikkei Education. Tôi có thể giúp gì cho bạn?",
      },
    ]);
  };

  return (
    <>
      {/* Icon mở chat */}
      <div
        className="fixed bottom-5 right-6 cursor-pointer select-none z-[1000]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <img src={frame} alt="chat icon" width="50" height="50" />
      </div>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[360px] h-[544px] bg-white rounded-3xl shadow-lg flex flex-col overflow-hidden z-[1001]">
          {/* Header */}
          <div className="bg-white shadow-md p-3 font-bold flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="relative">
                <img src={bot} alt="bot" className="w-8" />
                <img
                  src={ellipse}
                  alt="ellipse"
                  className="absolute bottom-1 right-1"
                />
              </div>
              <span>RikaBot</span>
            </div>
            <div className="flex gap-2 items-center">
              <img
                src={refresh}
                alt="reload"
                className="cursor-pointer"
                onClick={reloadChat}
              />
              <img
                src={minus}
                alt="close"
                className="cursor-pointer"
                onClick={() => setIsOpen(false)}
              />
            </div>
          </div>

          {/* Chat body */}
          <div
            ref={chatBodyRef}
            className="flex-1 p-3 flex flex-col gap-2 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300"
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.sender === "user" ? "justify-end" : "items-start gap-2"
                }`}
              >
                {msg.sender === "bot" && (
                  <img src={bot} alt="bot" className="w-8 h-8" />
                )}
                <div
                  className={`${
                    msg.sender === "user"
                      ? "bg-[#9b0029] text-white rounded-3xl rounded-br-none self-end"
                      : "bg-gray-100 text-gray-800 rounded-xl p-2"
                  } max-w-[80%] px-3 py-2`}
                  dangerouslySetInnerHTML={{
                    __html: msg.text.replace(/\n/g, "<br>"),
                  }}
                />
              </div>
            ))}
          </div>

          {/* Gợi ý nhanh */}
          {suggestionsVisible && (
            <div className="flex flex-wrap gap-2 p-3 border-t border-gray-200">
              {[
                "Các khóa học có sẵn?",
                "Làm thế nào để học hiệu quả?",
                "JavaScript là gì?",
                "TypeORM là gì?",
                "Hệ thống Quizz-Ranking là gì?",
              ].map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(q)}
                  className="bg-gray-100 hover:bg-[#9b0029] hover:text-white rounded-2xl px-3 py-1 text-sm transition"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Footer nhập liệu */}
          <form
            className="flex items-center gap-2 border border-gray-200 bg-gray-50 rounded-2xl mx-3 mb-2 px-3 py-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <div
              className="cursor-pointer"
              onClick={() => setSuggestionsVisible(!suggestionsVisible)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                <path
                  d="M2.5 10H17.5M2.5 5H17.5M2.5 15H17.5"
                  stroke={suggestionsVisible ? "#9b0029" : "#1E293B"}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Nhập tin nhắn..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 border-none bg-transparent outline-none text-sm"
            />
            <img
              src={sendIcon}
              alt="send"
              onClick={handleSend}
              className="cursor-pointer bg-[#9b0029] rounded-full p-2"
            />
          </form>

          <p className="text-center text-gray-500 text-[10px] pb-2">
            Thông tin chỉ mang tính tham khảo, được tư vấn bởi AI
          </p>
        </div>
      )}
    </>
  );
}
