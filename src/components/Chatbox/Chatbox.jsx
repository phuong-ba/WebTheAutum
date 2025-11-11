import React, { useState, useRef, useEffect } from "react";
import bot from "@/assets/iconchat/bot.png";
import refresh from "@/assets/iconchat/refresh-2.png";
import minus from "@/assets/iconchat/minus.png";
import sendIcon from "@/assets/iconchat/send-2.png";
import frame from "@/assets/iconchat/Frame 42500.png";

// ==================== ProductCard ====================
function ProductCard({ product }) {
  return (
    <div className="bg-white shadow-lg rounded-2xl p-4 max-w-[75%] hover:scale-105 transition-transform">
      {/* Tên sản phẩm */}
      <h3 className="font-semibold text-gray-800 text-lg mb-3">
        {product.tenSanPham}
      </h3>

      {/* Ảnh sản phẩm */}
      <img
        src={product.hinhAnh || "/default-product.png"}
        alt={product.tenSanPham}
        className="w-full h-48 object-cover rounded-lg mb-3"
      />

      {/* Chi tiết sản phẩm */}
      <div className="text-sm text-gray-700 space-y-1 mb-3">
        <p>
          <span className="font-semibold">Kiểu dáng:</span>{" "}
          {product.kieuDang || "-"}
        </p>
        <p>
          <span className="font-semibold">Chất liệu:</span>{" "}
          {product.chatLieu || "-"}
        </p>
        {product.mauSize?.length > 0 && (
          <>
            <p>
              <span className="font-semibold">Màu:</span>{" "}
              {Array.from(new Set(product.mauSize.map((ms) => ms.mau))).join(
                ", "
              )}
            </p>
            <p>
              <span className="font-semibold">Size:</span>{" "}
              {Array.from(new Set(product.mauSize.map((ms) => ms.size))).join(
                ", "
              )}
            </p>
          </>
        )}
      </div>

      {/* Giá */}
      {product.gia ? (
        <p className="text-red-600 font-bold text-lg mb-3">
          {product.gia.toLocaleString()}đ
        </p>
      ) : (
        <p className="text-gray-400 font-medium mb-3">Liên hệ</p>
      )}

      {/* Nút mua */}
      <button className="w-full bg-[#4d9feb] hover:bg-blue-600 text-white font-semibold py-2 rounded-xl transition">
        Chọn mua
      </button>
    </div>
  );
}

// ==================== Parse AI text thành products ====================
function parseProductText(text) {
  const products = [];
  const blocks = text.split(/\d+\.\s/).filter(Boolean);

  blocks.forEach((block) => {
    const lines = block
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    // Tên + giá
    const firstLine = lines[0];
    const match = firstLine.match(/(.+)\s*-\s*([\d,.]+)đ/);
    const tenSanPham = match ? match[1].trim() : firstLine;
    const gia = match ? Number(match[2].replace(/\D/g, "")) : 0;

    let kieuDang = "";
    let chatLieu = "";
    let mau = [];
    let size = [];
    let hinhAnh = "";

    lines.forEach((l) => {
      if (l.startsWith("- Kiểu dáng:")) {
        const parts = l.replace("- Kiểu dáng:", "").split(",");
        kieuDang = parts[0]?.trim() || "";
        chatLieu = parts[1]?.trim() || "";
      }
      if (l.startsWith("- Màu sắc:")) {
        mau = l
          .replace("- Màu sắc:", "")
          .split(",")
          .map((s) => s.trim());
      }
      if (l.startsWith("- Size:")) {
        size = l
          .replace("- Size:", "")
          .split(",")
          .map((s) => s.trim());
      }
      if (l.startsWith("- Ảnh:")) {
        hinhAnh = l.replace("- Ảnh:", "").trim();
      }
    });

    const mauSize = [];
    mau.forEach((m) => size.forEach((s) => mauSize.push({ mau: m, size: s })));

    products.push({ tenSanPham, gia, kieuDang, chatLieu, hinhAnh, mauSize });
  });

  return products;
}

// ==================== ChatMessage ====================
function ChatMessage({ msg }) {
  if (msg.type === "product") return <ProductCard product={msg.product} />;

  return (
    <div
      className={`flex ${
        msg.sender === "user" ? "justify-end" : "justify-start"
      }`}
    >
      {msg.sender === "bot" && (
        <img src={bot} alt="bot" className="w-10 h-10 mr-3" />
      )}
      <div
        className={`px-5 py-3 rounded-3xl break-words max-w-[70%] ${
          msg.sender === "user"
            ? "bg-[#9b0029] text-white rounded-br-none text-lg"
            : "bg-gray-100 text-gray-800 text-lg"
        }`}
      >
        <span
          dangerouslySetInnerHTML={{
            __html: (msg.text ?? "").replace(/\n/g, "<br>"),
          }}
        />
      </div>
    </div>
  );
}

// ==================== Chatbox ====================
export default function Chatbox() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Xin chào! Tôi có thể giúp gì cho bạn." },
  ]);
  const [input, setInput] = useState("");
  const [showQuick, setShowQuick] = useState(true); // ✅ chỉ hiện quick khi bắt đầu chat
  const chatBodyRef = useRef(null);

  const quickSuggestions = [
    "Shop có các Sản phẩm nào",
    "Có Sản phẩm nào giảm giá không?",
    "Tôi muốn nhân viên tư vấn",
  ];

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTo({
        top: chatBodyRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const handleSend = async (text) => {
    const userText = text || input.trim();
    if (!userText) return;
    setInput("");
    setShowQuick(false); // ✅ ẩn quick khi gửi tin nhắn

    setMessages((prev) => [
      ...prev,
      { sender: "user", text: userText },
      { sender: "bot", text: "Đang trả lời..." },
    ]);

    try {
      const res = await fetch("http://localhost:8080/api/chatbot/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      });
      const data = await res.json();

      if (data.topic === "sanpham_text" && data.reply) {
        // ✅ tách chào và sản phẩm
        const lines = data.reply.split("\n").filter((l) => l.trim() !== "");
        let greeting = "";
        let productText = data.reply;

        if (lines[0].toLowerCase().includes("chào bạn")) {
          greeting = lines[0];
          productText = lines.slice(1).join("\n");
        }

        const products = parseProductText(productText);
        const newMessages = [];
        if (greeting) newMessages.push({ sender: "bot", text: greeting });
        if (products.length) {
          newMessages.push({
            sender: "bot",
            text: "Dưới đây là các sản phẩm bạn có thể tham khảo:",
          });
          products.forEach((p, idx) =>
            newMessages.push({
              sender: "bot",
              type: "product",
              product: p,
              key: idx,
            })
          );
        }

        setMessages((prev) => [...prev.slice(0, -1), ...newMessages]);
      } else if (data.reply) {
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { sender: "bot", text: data.reply },
        ]);
      } else {
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { sender: "bot", text: "Xin lỗi, tôi không có câu trả lời." },
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { sender: "bot", text: "Có lỗi xảy ra 😢" },
      ]);
    }
  };

  const handleQuickSend = (text) => {
    handleSend(text);
  };

  return (
    <>
      {/* Icon mở chat */}
      <div
        className="fixed bottom-5 right-6 cursor-pointer z-[1000] hover:scale-110 transition-transform"
        onClick={() => setIsOpen(!isOpen)}
      >
        <img src={frame} alt="chat icon" width="50" height="50" />
      </div>

      {isOpen && (
        <div className="fixed bottom-20 right-6 w-[500px] h-[700px] bg-white rounded-3xl shadow-xl flex flex-col overflow-hidden z-[1001]">
          {/* Header */}
          <div className="bg-white shadow-md p-5 flex justify-between items-center rounded-t-3xl">
            <div className="flex items-center gap-4">
              <img src={bot} alt="bot" className="w-12 h-12" />
              <div>
                <p className="font-semibold text-gray-700 text-lg">RikaBot</p>
                <p className="text-sm text-gray-400">Đang hoạt động</p>
              </div>
            </div>
            <div className="flex gap-3">
              <img
                src={refresh}
                alt="reload"
                className="cursor-pointer w-6 h-6"
                onClick={() =>
                  setMessages([
                    {
                      sender: "bot",
                      text: "Xin chào! Tôi có thể giúp gì cho bạn.",
                    },
                  ])
                }
              />
              <img
                src={minus}
                alt="close"
                className="cursor-pointer w-6 h-6"
                onClick={() => setIsOpen(false)}
              />
            </div>
          </div>

          {/* Body chat */}
          <div
            ref={chatBodyRef}
            className="flex-1 p-5 flex flex-col gap-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 text-base"
          >
            {messages.map((msg, idx) => (
              <ChatMessage key={idx} msg={msg} />
            ))}
          </div>

          {/* Quick suggestions */}
          {showQuick && (
            <div className="flex flex-wrap gap-3 p-4 border-t border-gray-200">
              {quickSuggestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickSend(q)}
                  className="bg-gray-100 hover:bg-[#4d9feb] hover:text-white rounded-full px-5 py-2 text-base transition"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Footer */}
          <form
            className="flex items-center gap-3 border border-gray-200 bg-gray-50 rounded-2xl mx-4 mb-4 px-4 py-3"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              type="text"
              placeholder="Nhập tin nhắn..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 border-none bg-transparent outline-none text-base placeholder-gray-400"
            />
            <button
              type="submit"
              className="bg-[#4d9feb] hover:bg-blue-600 p-3 rounded-full"
            >
              <img src={sendIcon} alt="send" className="w-6 h-6" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
