// utils/notification.js

let io; 
const users = {}; // userId -> socketId mapping

// Socket.IO instance'ini o'rnatish
const setIoInstance = (socketIoInstance) => {
    io = socketIoInstance;
    console.log('✅ Socket.IO instance set in notification utility.');

    io.on("connection", (socket) => {
        // Foydalanuvchidan userId olish (query orqali)
        const userId = socket.handshake.query.userId;

        if (userId) {
            users[userId] = socket.id;
            console.log(`🟢 User ${userId} connected with socket ${socket.id}`);
        }

        socket.on("disconnect", () => {
            if (userId) {
                delete users[userId];
                console.log(`🔴 User ${userId} disconnected`);
            }
        });
    });
};

// Bildirishnoma yuborish
const sendNotificationToUser = (userId, message) => {
    if (io && users[userId]) {
        io.to(users[userId]).emit("notification", message); // event nomi: "notification"
        console.log(`📨 Notification sent to user ${userId}: ${JSON.stringify(message)}`);
    } else {
        console.warn(`⚠️ User ${userId} not connected. Cannot send notification.`);
    }
};

module.exports = {
    setIoInstance,
    sendNotificationToUser
};
