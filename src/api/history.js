import baseUrl from "./instance";

const chatApi = {
    // Lấy danh sách phòng chat
    getAllRooms() {
        return baseUrl.get("chatbot/rooms");
    },

    // Tham gia phòng chat
    joinRoom(roomId, idNhanVien = 1) {
        return baseUrl.post("chatbot/rooms/join", null, {
            params: { roomId, idNhanVien }
        });
    },

    // Rời phòng chat
    leaveRoom(roomId, idNhanVien = 1) {
        return baseUrl.post("chatbot/rooms/leave", null, {
            params: { roomId, idNhanVien }
        });
    },

    // Lấy lịch sử chat
    getChatHistory(roomId) {
        return baseUrl.get(`chatbot/history/${roomId}`);
    },

    // Gửi tin nhắn
    sendMessage(roomId, message, guiTu = 1) {
        return baseUrl.post("chatbot/send", {
            roomId,
            message,
            guiTu
        });
    }
};

export default chatApi;