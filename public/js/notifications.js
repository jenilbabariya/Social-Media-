document.addEventListener("DOMContentLoaded", () => {

    // ─── TAB SWITCHING ──────────────────────────────────────────────────────
    const tabs = document.querySelectorAll(".notif-tab");
    const panels = document.querySelectorAll(".notif-panel");

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const target = tab.dataset.tab;

            tabs.forEach(t => t.classList.remove("active"));
            panels.forEach(p => p.classList.add("hidden"));

            tab.classList.add("active");
            document.getElementById(`panel-${target}`).classList.remove("hidden");

            // Update URL tab param without reload
            const url = new URL(window.location);
            url.searchParams.set("tab", target);
            window.history.replaceState({}, "", url);
        });
    });

    // ─── MARK ALL READ ──────────────────────────────────────────────────────
    const markAllReadButton = document.getElementById("markAllRead");
    if (markAllReadButton) {
        markAllReadButton.addEventListener("click", async () => {
            try {
                const res = await fetch("/notifications/mark-all-read", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" }
                });
                const data = await res.json();
                if (data.flag === 1) {
                    document.querySelectorAll(".notification-card.unread").forEach(el => {
                        el.classList.remove("unread");
                        el.querySelector(".notification-dot")?.remove();
                    });
                    markAllReadButton.remove();

                    // Remove the badge from the Notifications tab
                    document.getElementById("notif-unread-badge")?.remove();
                }
            } catch (error) {
                console.error("Error marking notifications as read:", error);
            }
        });
    }

    // ─── MARK SINGLE NOTIFICATION AS READ ──────────────────────────────────
    document.querySelectorAll(".notification-card:not(.request-card)").forEach(card => {
        card.addEventListener("click", async () => {
            const notificationId = card.dataset.id;
            const refId = card.dataset.reference;
            const type = card.dataset.type;
            
            if (card.classList.contains("unread")) {
                try {
                    const res = await fetch(`/notifications/mark-as-read/${notificationId}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: notificationId })
                    });
                    const data = await res.json();
                    if (data.flag === 1) {
                        card.classList.remove("unread");
                        card.querySelector(".notification-dot")?.remove();

                        // Decrement badge count
                        const badge = document.getElementById("notif-unread-badge");
                        if (badge) {
                            const count = parseInt(badge.textContent) - 1;
                            if (count <= 0) {
                                badge.remove();
                                document.getElementById("markAllRead")?.remove();
                            } else {
                                badge.textContent = count;
                            }
                        }
                    }
                } catch (error) {
                    console.error("Error marking notification as read:", error);
                }
            }
            
            if (refId && ['like', 'comment', 'mention'].includes(type) && refId !== 'null' && refId !== 'undefined') {
                window.location.href = `/p/${refId}`;
            }
        });
    });

    // ─── ACCEPT / REJECT FOLLOW REQUESTS ───────────────────────────────────
    async function handleFollowRequest(requestId, action) {
        try {
            const res = await fetch(`/notifications/follow-request/${requestId}/${action}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" }
            });
            const data = await res.json();

            if (data.flag === 1) {
                const card = document.getElementById(`req-${requestId}`);
                if (card) {
                    card.classList.add("removing");
                    card.addEventListener("animationend", () => {
                        card.remove();

                        // Update the badge count
                        const badge = document.getElementById("requests-badge");
                        if (badge) {
                            const count = parseInt(badge.textContent) - 1;
                            if (count <= 0) {
                                badge.remove();
                            } else {
                                badge.textContent = count;
                            }
                        }

                        // Show empty state if no more requests
                        const remaining = document.querySelectorAll("#panel-requests .request-card");
                        if (remaining.length === 0) {
                            const panel = document.getElementById("panel-requests");
                            panel.innerHTML = `
                                <div class="notifications-empty">
                                    <i class="bi bi-person-plus" style="font-size:40px;color:var(--bs-primary);"></i>
                                    <p class="mt-2">No follow requests</p>
                                </div>`;
                        }
                    }, { once: true });
                }
            }
        } catch (error) {
            console.error(`Error ${action}ing follow request:`, error);
        }
    }

    document.querySelectorAll(".btn-accept").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            handleFollowRequest(btn.dataset.id, "accept");
        });
    });

    document.querySelectorAll(".btn-reject").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            handleFollowRequest(btn.dataset.id, "reject");
        });
    });

    // ─── REAL-TIME NOTIFICATIONS ───────────────────────────────────────────
    window.prependNotification = (data) => {
        const panel = document.getElementById("panel-notifications");
        if (!panel) return;

        // Remove empty state if present
        const emptyState = panel.querySelector(".notifications-empty");
        if (emptyState) emptyState.remove();

        const card = document.createElement("div");
        card.className = "notification-card unread";
        card.dataset.id = data._id || Date.now();
        if (data.postId) card.dataset.reference = data.postId;
        if (data.type) card.dataset.type = data.type;
        
        const profilePic = data.sender?.profilePicture || "/images/default-avatar.png";
        
        card.innerHTML = `
            <div class="notification-avatar">
                <img src="${profilePic}" alt="${data.sender?.username || 'User'}">
            </div>
            <div class="notification-content">
                <p class="notification-text">
                    <span class="notification-username">@${data.sender?.username || "Someone"}</span> ${
                        data.type === 'follow' ? 'started following you' :
                        data.type === 'follow_accept' ? 'accepted your follow request' :
                        data.type === 'like' ? 'liked your post' :
                        data.type === 'comment' ? 'commented on your post' :
                        data.type === 'mention' ? 'mentioned you in a post' :
                        data.message
                    }
                </p>
                <span class="notification-time">Just now</span>
            </div>
            <div class="notification-dot"></div>
        `;

        panel.prepend(card);

        // Add click listener for the new card
        card.addEventListener("click", async () => {
            if (card.classList.contains("unread")) {
                card.classList.remove("unread");
                card.querySelector(".notification-dot")?.remove();
                
                if (data._id) {
                    try {
                        await fetch(`/notifications/mark-as-read/${data._id}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ id: data._id })
                        });
                        
                        const badge = document.getElementById("notif-unread-badge");
                        if (badge) {
                            const count = parseInt(badge.textContent) - 1;
                            if (count <= 0) {
                                badge.remove();
                                document.getElementById("markAllRead")?.remove();
                            } else {
                                badge.textContent = count;
                            }
                        }
                    } catch (error) {
                        console.error("Error marking real-time notification as read:", error);
                    }
                }
            }
            
            if (data.postId && ['like', 'comment', 'mention'].includes(data.type)) {
                window.location.href = `/p/${data.postId}`;
            }
        });
    };

});

