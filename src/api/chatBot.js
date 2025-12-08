// chatBot.js

import baseUrl from "./instance";


export const chatBotApi = {
    getRoomByCustomer: (customerId) => {
        return baseUrl.get(`chatbot/rooms/by-customer/${customerId}`);
    },

    getGuestRoom: () => {
        return baseUrl.get(`chatbot/rooms/guest`);
    },

    getChatHistory: (roomId) => {
        return baseUrl.get(`chatbot/history/${roomId}`);
    },

    sendMessage: (data) => {
        return baseUrl.post(`chatbot/send`, data);
    }
};