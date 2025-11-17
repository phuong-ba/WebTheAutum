import React, { useEffect, useState, useRef } from "react";
import SockJS from "sockjs-client";
import Stomp from "stompjs";

let stompClient = null;

export default function AdminDashboard() {
  const [rooms, setRooms] = useState([]);
  const [roomId, setRoomId] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isJoined, setIsJoined] = useState(false); // trạng thái admin online/offline
  const subscriptionRef = useRef(null);

  useEffect(() => {
    const socket = new SockJS("http://localhost:8080/ws");
    stompClient = Stomp.over(socket);

    stompClient.connect({}, () => {
      // Subscribe danh sách tất cả phòng
      stompClient.subscribe("/topic/chat/all", (msg) => {
        const message = JSON.parse(msg.body);
        setRooms((prev) =>
          prev.includes(message.roomId) ? prev : [...prev, message.roomId]
        );
      });
    });

    return () => {
      if (stompClient) stompClient.disconnect();
    };
  }, []);

  const joinRoom = (id) => {
    setRoomId(id);
    setMessages([]);
    setIsJoined(true);

    if (subscriptionRef.current) subscriptionRef.current.unsubscribe();

    subscriptionRef.current = stompClient.subscribe(
      `/topic/chat/${id}`,
      (msg) => {
        const message = JSON.parse(msg.body);
        setMessages((prev) => [...prev, message]);
      }
    );

    // Gửi trạng thái nhân viên online
    stompClient.send(
      `/app/chat.staff.join/${id}`,
      {},
      JSON.stringify({
        sender: "staff",
        type: "staff_status",
        online: true,
        roomId: id,
      })
    );
  };

  const leaveRoom = () => {
    if (!roomId) return;

    // Gửi trạng thái nhân viên offline
    stompClient.send(
      `/app/chat.staff.leave/${roomId}`,
      {},
      JSON.stringify({
        sender: "staff",
        type: "staff_status",
        online: false,
        roomId: roomId,
      })
    );

    if (subscriptionRef.current) subscriptionRef.current.unsubscribe();
    setRoomId("");
    setMessages([]);
    setIsJoined(false);
  };

  const sendMsg = () => {
    if (!input.trim() || !roomId) return;
    const msg = { roomId, sender: "staff", content: input, type: "message" };
    stompClient.send(`/app/chat.send/${roomId}`, {}, JSON.stringify(msg));
    setMessages((prev) => [...prev, msg]);
    setInput("");
  };

  return (
    <div className="flex h-screen">
      {/* Danh sách phòng */}
      <div className="w-64 bg-gray-200 p-4">
        <h2 className="font-bold text-lg mb-3">Danh sách phòng</h2>
        {rooms.map((r) => (
          <div
            key={r}
            className={`p-2 mb-2 cursor-pointer rounded ${
              r === roomId ? "bg-blue-100 font-semibold" : "bg-white"
            }`}
            onClick={() => setRoomId(r)}
          >
            {r}
          </div>
        ))}

        {roomId && (
          <div className="flex gap-2 mt-3">
            {!isJoined ? (
              <button
                className="bg-green-500 text-white px-4 py-2 rounded-xl"
                onClick={() => joinRoom(roomId)}
              >
                Tham gia chat
              </button>
            ) : (
              <button
                className="bg-red-500 text-white px-4 py-2 rounded-xl"
                onClick={leaveRoom}
              >
                Thoát chat
              </button>
            )}
          </div>
        )}
      </div>

      {/* Chatbox */}
      <div className="flex-1 flex flex-col">
        <h2 className="p-4 font-bold bg-gray-100">
          Đang chat tại: {roomId || "—"}
        </h2>

        <div className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${
                msg.sender === "staff" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`px-3 py-2 rounded-xl ${
                  msg.sender === "staff"
                    ? "bg-green-200"
                    : msg.sender === "ai"
                    ? "bg-yellow-100"
                    : "bg-gray-300"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
        </div>

        {isJoined && (
          <form
            className="p-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              sendMsg();
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 border px-3 py-2 rounded-xl"
              placeholder="Nhập tin nhắn..."
            />
            <button className="bg-green-400 text-white px-4 py-2 rounded-xl">
              Gửi
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
