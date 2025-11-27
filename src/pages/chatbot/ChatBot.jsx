import React, { useState, useEffect, useRef } from "react";
import SockJS from "sockjs-client";
import { over } from "stompjs";

export default function AdminChat() {
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");

  const stompClient = useRef(null);
  const subscriptionRef = useRef(null);
  const bottomRef = useRef();

  // Load tất cả phòng chat
  useEffect(() => {
    fetch("http://localhost:8080/api/chatbot/rooms")
      .then((res) => res.json())
      .then((data) => setRooms(data.rooms || []))
      .catch(console.error);
  }, []);

  // Khi chọn phòng
  const joinRoom = async (room) => {
    setCurrentRoom(room);
    setMessages([]);

    await fetch(
      `http://localhost:8080/api/chatbot/rooms/join?roomId=${room.roomId}&idNhanVien=1`,
      { method: "POST" }
    );

    connectWS(room.roomId);
    loadHistory(room.roomId);
  };

  // Rời phòng
  const leaveRoom = async () => {
    if (!currentRoom) return;

    await fetch(
      `http://localhost:8080/api/chatbot/rooms/leave?roomId=${currentRoom.roomId}&idNhanVien=1`,
      { method: "POST" }
    );

    if (subscriptionRef.current) subscriptionRef.current.unsubscribe();
    if (stompClient.current) stompClient.current.disconnect();

    setCurrentRoom(null);
    setMessages([]);
  };

  // Load lịch sử chat
  const loadHistory = async (rid) => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/chatbot/history/${rid}`
      );
      const data = await res.json();
      setMessages(data);
    } catch (e) {
      console.error(e);
    }
  };

  // Kết nối WS
  const connectWS = (rid) => {
    if (stompClient.current) {
      if (subscriptionRef.current) subscriptionRef.current.unsubscribe();
      stompClient.current.disconnect();
    }

    const sock = new SockJS("http://localhost:8080/ws");
    stompClient.current = over(sock);
    stompClient.current.connect({}, () => {
      subscriptionRef.current = stompClient.current.subscribe(
        `/topic/chat/${rid}`,
        (msg) => {
          const body = JSON.parse(msg.body);
          setMessages((prev) => [...prev, body]);
        }
      );
    });
  };

  const sendMessage = async () => {
    if (!message.trim() || !currentRoom) return;
    const msg = message;
    setMessage("");

    await fetch("http://localhost:8080/api/chatbot/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId: currentRoom.roomId,
        message: msg,
        guiTu: 1,
      }),
    });
  };

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
                  <>
                    <span className="text-sm">{m.noiDung}</span>{" "}
                    <span className="text-[10px] font-semibold">: Bạn</span>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] font-semibold">
                      {m.guiTu === 0 ? "Khách" : "AI"}:
                    </span>{" "}
                    <span className="text-sm">{m.noiDung}</span>
                  </>
                )}
              </div>
            </div>
          ))}

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
