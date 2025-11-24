import React, { useState, useEffect, useRef } from "react";
import SockJS from "sockjs-client";
import { over } from "stompjs";

let stompClient = null;

export default function AdminChat() {
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  // Lưu subscription để hủy khi chuyển phòng
  const subscriptionRef = useRef(null);

  useEffect(() => {
    connectWebSocket();

    fetch("http://localhost:8080/api/chatbot/rooms")
      .then((res) => res.json())
      .then((data) => setRooms(data.rooms || []))
      .catch(console.error);
  }, []);

  // ----------------------------
  // KẾT NỐI WEBSOCKET
  // ----------------------------
  const connectWebSocket = () => {
    const socket = new SockJS("http://localhost:8080/ws");
    stompClient = over(socket);

    stompClient.connect({}, () => {
      console.log("Đã kết nối WebSocket");
    });
  };

  // ----------------------------
  // NHÂN VIÊN JOIN 1 PHÒNG
  // ----------------------------
  const joinRoom = (roomId) => {
    setCurrentRoom(roomId);
    setMessages([]);

    // HỦY SUBSCRIBE CŨ
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }

    // SUBSCRIBE PHÒNG MỚI
    subscriptionRef.current = stompClient.subscribe(
      `/topic/chat/${roomId}`,
      (msg) => {
        const data = JSON.parse(msg.body);

        setMessages((prev) => {
          // tránh thêm trùng
          if (prev.some((m) => m.id === data.id)) return prev;
          return [...prev, data];
        });
      }
    );

    // Gửi sự kiện nhân viên tham gia phòng
    const joinMsg = {
      phongId: roomId,
      nguoiGui: "admin",
      role: "admin",
      noiDung: "",
    };

    stompClient.send("/app/chat/staffJoin", {}, JSON.stringify(joinMsg));
  };

  // ----------------------------
  // GỬI TIN NHẮN
  // ----------------------------
  const sendMessage = () => {
    if (!input.trim() || !currentRoom) return;

    const msg = {
      phongId: currentRoom,
      nguoiGui: "admin",
      role: "admin",
      noiDung: input,
    };

    stompClient.send("/app/chat/sendMessage", {}, JSON.stringify(msg));
    setInput("");
  };

  return (
    <div style={{ display: "flex", gap: 20, padding: 20 }}>
      {/* DANH SÁCH PHÒNG */}
      <div style={{ width: 200, borderRight: "1px solid #ccc" }}>
        <h3>Danh sách phòng</h3>
        {rooms.map((r) => (
          <div
            key={r.roomId}
            onClick={() => joinRoom(r.roomId)}
            style={{
              padding: 10,
              marginBottom: 10,
              cursor: "pointer",
              background: currentRoom === r.roomId ? "#eee" : "#fff",
              border: "1px solid #ccc",
            }}
          >
            {r.roomId}
          </div>
        ))}
      </div>

      {/* KHUNG CHAT */}
      <div style={{ flex: 1 }}>
        <h3>Phòng: {currentRoom || "Chưa chọn phòng"}</h3>

        <div
          style={{
            border: "1px solid #ccc",
            height: 400,
            overflowY: "auto",
            padding: 10,
            marginBottom: 10,
          }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                marginBottom: 10,
                textAlign: msg.role === "admin" ? "right" : "left",
              }}
            >
              <b>{msg.role}:</b> {msg.noiDung}
            </div>
          ))}
        </div>

        {/* KHUNG GỬI TIN */}
        <div style={{ display: "flex", gap: 10 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nhập tin..."
            style={{ flex: 1, padding: 8 }}
          />
          <button onClick={sendMessage} style={{ padding: "8px 15px" }}>
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
}
