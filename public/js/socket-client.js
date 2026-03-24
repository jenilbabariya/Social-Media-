const socket = io();

socket.on("connect", () => {
    console.log("Connected to server via Socket.IO. Socket ID:", socket.id);
});

socket.on("connect_error", (err) => {
    console.error("Socket connection error:", err.message);
});

socket.on("notification:new", (data) => {
    console.log("New notification received:", data);

    
    // Show toast if showToast function exists (usually in common.js or similar)
    if (window.showToast) {
        window.showToast(data.message || "You have a new notification");
    }

    // Update notification badge if it exists
    const badge = document.querySelector(".notification-badge");
    if (badge) {
        const currentCount = parseInt(badge.innerText) || 0;
        badge.innerText = currentCount + 1;
        badge.classList.remove("d-none");
    }

    // If we are on the notifications page, we might want to reload or prepend
    if (window.location.pathname === "/notifications" && window.prependNotification) {
        window.prependNotification(data);
    }
});

window.joinPostRoom = (postId) => {
    socket.emit("join-post", postId);
};

window.leavePostRoom = (postId) => {
    socket.emit("leave-post", postId);
};

window.socket = socket;
