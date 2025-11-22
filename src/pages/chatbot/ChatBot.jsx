import React, { useState, useEffect, useRef } from "react";
import SockJS from "sockjs-client";
import { over } from "stompjs";

let stompClient = null;

export default function AdminChat() {
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const chatRef = useRef(null);

  useEffect(() => {
    const socket = new SockJS("http://localhost:8080/ws");
    stompClient = over(socket);

    stompClient.connect({}, () => {
      // Subscribe tất cả phòng mới
      stompClient.subscribe("/topic/chat/all", (msg) => {
        const data = JSON.parse(msg.body);
        if (data.type === "new_room") {
          setRooms((prev) =>
            !prev.find((r) => r.roomId === data.roomId)
              ? [...prev, { roomId: data.roomId }]
              : prev
          );
        }
      });
    });

    return () => stompClient?.disconnect();
  }, []);

  // Join room → subscribe room này + thông báo staff join
  const joinRoom = (roomId) => {
    setCurrentRoom(roomId);
    setMessages([]);

    // Thông báo BE nhân viên đã vào
    stompClient.send(`/app/chat.staff.join/${roomId}`, {}, {});

    stompClient.subscribe(`/topic/chat/${roomId}`, (msg) => {
      const data = JSON.parse(msg.body);
      setMessages((prev) => [...prev, data]);
    });
  };

  // Thoát phòng
  const leaveRoom = () => {
    if (!currentRoom) return;

    // Gửi thông báo cho BE nếu muốn
    stompClient.send(`/app/chat.staff.leave/${currentRoom}`, {}, {});

    setCurrentRoom(null);
    setMessages([]);
  };

  const sendMsg = () => {
    if (!input.trim() || !currentRoom) return;

    const msg = {
      sender: "staff",
      content: input,
      type: "staff",
      roomId: currentRoom,
    };

    stompClient.send(`/app/chat.send/${currentRoom}`, {}, JSON.stringify(msg));
    setMessages((prev) => [...prev, msg]);
    setInput("");
  };

  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const renderMessage = (m, i) => {
    let bg = "bg-gray-100 text-gray-800";
    if (m.sender === "staff") bg = "bg-blue-500 text-white";
    else if (m.sender === "user") bg = "bg-green-100 text-green-800";
    else if (m.type === "ai_reply") bg = "bg-purple-100 text-purple-800";
    else if (m.type === "new_room") bg = "bg-gray-200 text-gray-600 italic";
    else if (m.type === "staff_status")
      bg = "bg-yellow-100 text-yellow-800 italic";

    return (
      <div
        key={i}
        className={`flex ${
          m.sender === "staff" ? "justify-end" : "justify-start"
        }`}
      >
        <div className={`px-3 py-2 rounded-xl max-w-[70%] break-words ${bg}`}>
          {m.content}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-[90vh] p-4 gap-4">
      <div className="w-60 border rounded-xl p-2 overflow-y-auto">
        <h2 className="font-semibold text-lg mb-2">Danh sách phòng</h2>
        {rooms.map((r) => (
          <div
            key={r.roomId}
            className={`p-2 rounded-lg cursor-pointer mb-1 ${
              currentRoom === r.roomId ? "bg-blue-100" : "hover:bg-gray-100"
            }`}
            onClick={() => joinRoom(r.roomId)}
          >
            {r.roomId}
          </div>
        ))}
      </div>

      <div className="flex-1 flex flex-col border rounded-xl">
        <div className="p-3 border-b font-semibold flex justify-between items-center">
          {currentRoom ? `Phòng: ${currentRoom}` : "Chọn phòng để chat"}
          {currentRoom && (
            <button
              className="px-3 py-1 bg-red-500 text-white rounded-xl text-sm"
              onClick={leaveRoom}
            >
              Thoát
            </button>
          )}
        </div>

        <div
          ref={chatRef}
          className="flex-1 p-3 overflow-y-auto space-y-2 bg-gray-50"
        >
          {messages.map(renderMessage)}
        </div>

        {currentRoom && (
          <div className="p-3 border-t flex gap-2">
            <input
              className="flex-1 border rounded-xl px-3 py-2"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMsg()}
              placeholder="Nhập tin nhắn..."
            />
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-xl"
              onClick={sendMsg}
            >
              Gửi
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
