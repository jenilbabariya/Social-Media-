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
    let sidebarBadge = document.querySelector(".sidebar-notif-badge");
    if (!sidebarBadge) {
        const navLink = document.querySelector('a[href="/notifications"]');
        if (navLink) {
            sidebarBadge = document.createElement("span");
            sidebarBadge.className = "sidebar-notif-badge ml-auto";
            sidebarBadge.innerText = "0";
            navLink.appendChild(sidebarBadge);
        }
    }
    
    if (sidebarBadge) {
        const currentCount = parseInt(sidebarBadge.innerText) || 0;
        sidebarBadge.innerText = currentCount + 1;
        sidebarBadge.classList.remove("d-none");
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
