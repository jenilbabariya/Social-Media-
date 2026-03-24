document.addEventListener("DOMContentLoaded", () => {
    const likeBtn = document.getElementById("singlePostLikeBtn");
    const likesCountEl = document.getElementById("singlePostLikesCount");
    const deleteBtn = document.getElementById("deletePostBtn");
    const commentForm = document.getElementById("commentForm");
    const commentInput = document.getElementById("commentInput");
    const postCommentBtn = document.getElementById("postCommentBtn");
    const commentsList = document.getElementById("commentsList");

    const postId = likeBtn ? likeBtn.dataset.id : (deleteBtn ? deleteBtn.dataset.id : null);

    if (postId) {
        // Join the post room for real-time updates
        if (window.joinPostRoom) {
            window.joinPostRoom(postId);
        }

        // Load existing comments
        loadComments(postId);

        // Listen for socket events
        if (window.socket) {
            window.socket.on("post:liked", (data) => {
                if (likesCountEl) {
                    likesCountEl.textContent = `${data.likesCount} likes`;
                }
            });

            window.socket.on("post:unliked", (data) => {
                if (likesCountEl) {
                    likesCountEl.textContent = `${data.likesCount} likes`;
                }
            });

            window.socket.on("post:commented", (comment) => {
                console.log("Comment received via socket:", comment);
                // Check if comment already exists in this tab (to avoid double-posting in the triggering tab)
                const existing = document.querySelector(`[data-comment-id="${comment._id}"]`);
                if (!existing) {
                    appendComment(comment);
                }
            });
            window.socket.on("post:replied", ({ commentId, reply }) => {
                const commentContainer = document.querySelector(`[data-comment-id="${commentId}"]`);
                if (commentContainer) {
                    const repliesContainer = commentContainer.querySelector('.replies-container');
                    if (repliesContainer) {
                        if (!repliesContainer.querySelector(`[data-reply-id="${reply._id}"]`)) {
                            const rHtml = `
                                <div class="d-flex mt-2 ms-4" data-reply-id="${reply._id}">
                                    <a href="/profile/${reply.user.username}" class="flex-shrink-0">
                                        <img src="${reply.user.profilePicture || '/images/default-avatar.png'}" class="rounded-circle me-2" width="24" height="24" style="object-fit: cover;">
                                    </a>
                                    <div>
                                        <span class="fw-bold me-1">
                                            <a href="/profile/${reply.user.username}" class="text-decoration-none text-dark" style="font-size: 13px;">${reply.user.username}</a>
                                        </span>
                                        <span style="word-break: break-word; font-size: 13px;">${reply.text}</span>
                                        <div class="text-muted" style="font-size: 10px;">${new Date(reply.createdAt).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            `;
                            repliesContainer.insertAdjacentHTML('beforeend', rHtml);
                            const container = document.getElementById("commentsContainer");
                            if (container) container.scrollTop = container.scrollHeight;
                        }
                    }
                }
            });

        }
    }

    async function loadComments(postId) {
        try {
            const res = await fetch(`/api/posts/comments/${postId}`);
            const data = await res.json();
            if (data.flag === 1) {
                const comments = data.data.comments;
                commentsList.innerHTML = "";
                if (comments.length === 0) {
                    commentsList.innerHTML = `
                        <div class="no-comments-msg text-center my-5">
                            <i class="bi bi-chat-dots fs-1 text-muted opacity-50 d-block mb-3"></i>
                            <span class="fw-bold text-dark d-block">No comments yet</span>
                            <span class="text-muted small">Start the conversation.</span>
                        </div>
                    `;
                } else {
                    comments.reverse().forEach(comment => appendComment(comment));
                }
            }
        } catch (error) {
            console.error("Load Comments Error:", error);
        }
    }

    if (postId) {
        // ... (socket listener for replies needs to be added inside DOMContentLoaded, let's keep it clean)
    }

    function appendComment(comment) {
        // Prevent duplication if already exists in DOM
        if (document.querySelector(`[data-comment-id="${comment._id}"]`)) {
            return;
        }

        const noCommentsMsg = commentsList.querySelector(".no-comments-msg");
        if (noCommentsMsg) {
            noCommentsMsg.remove();
        }

        const commentDiv = document.createElement("div");
        commentDiv.className = "d-flex mb-3";
        commentDiv.dataset.commentId = comment._id;
        
        // Generate existing replies HTML
        let repliesHtml = "";
        if (comment.replies && comment.replies.length > 0) {
            repliesHtml = comment.replies.map(r => `
                <div class="d-flex mt-2 ms-4" data-reply-id="${r._id || 'temp'}">
                    <a href="/profile/${r.user.username}" class="flex-shrink-0">
                        <img src="${r.user.profilePicture || '/images/default-avatar.png'}" class="rounded-circle me-2" width="24" height="24" style="object-fit: cover;">
                    </a>
                    <div>
                        <span class="fw-bold me-1">
                            <a href="/profile/${r.user.username}" class="text-decoration-none text-dark" style="font-size: 13px;">${r.user.username}</a>
                        </span>
                        <span style="word-break: break-word; font-size: 13px;">${r.text}</span>
                        <div class="text-muted" style="font-size: 10px;">${new Date(r.createdAt).toLocaleDateString()}</div>
                    </div>
                </div>
            `).join("");
        }

        commentDiv.innerHTML = `
            <a href="/profile/${comment.user.username}" class="flex-shrink-0">
                <img src="${comment.user.profilePicture || '/images/default-avatar.png'}" class="rounded-circle me-3" width="32" height="32" style="object-fit: cover;">
            </a>
            <div class="flex-grow-1">
                <span class="fw-bold me-1">
                    <a href="/profile/${comment.user.username}" class="text-decoration-none text-dark">${comment.user.username}</a>
                </span>
                <span style="word-break: break-word; font-size: 14px;">${comment.text}</span>
                <div class="d-flex align-items-center mt-1">
                    <div class="text-muted me-3" style="font-size: 10px;">${new Date(comment.createdAt).toLocaleDateString()}</div>
                    <button class="btn btn-link text-muted p-0 text-decoration-none reply-btn" style="font-size: 11px; font-weight: 600;">Reply</button>
                </div>
                
                <div class="replies-container">
                    ${repliesHtml}
                </div>
                
                <div class="reply-input-container d-none mt-2 ms-4">
                    <input type="text" class="form-control form-control-sm reply-input" placeholder="Add a reply..." style="border-radius: 20px; font-size: 13px;">
                </div>
            </div>
        `;
        commentsList.appendChild(commentDiv);
        
        // Scroll to bottom
        const container = document.getElementById("commentsContainer");
        if (container) container.scrollTop = container.scrollHeight;
    }


    if (commentInput) {
        commentInput.addEventListener("input", () => {
            if (commentInput.value.trim().length > 0) {
                postCommentBtn.disabled = false;
                postCommentBtn.classList.remove("opacity-50");
            } else {
                postCommentBtn.disabled = true;
                postCommentBtn.classList.add("opacity-50");
            }
        });
    }

    if (commentForm) {
        commentForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const text = commentInput.value.trim();
            if (!text) return;

            try {
                postCommentBtn.disabled = true;
                const res = await fetch(`/api/posts/comment/${postId}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text })
                });

                const data = await res.json();
                if (data.flag === 1) {
                    commentInput.value = "";
                    postCommentBtn.disabled = true;
                    postCommentBtn.classList.add("opacity-50");
                    appendComment(data.data.comment);
                } else {
                    if (window.showToast) window.showToast(data.message || "Failed to post comment", "danger");
                }
            } catch (error) {
                console.error("Comment Error:", error);
            } finally {
                postCommentBtn.disabled = false;
            }
        });
    }

    if (commentsList) {
        commentsList.addEventListener("click", (e) => {
            if (e.target.classList.contains("reply-btn")) {
                document.querySelectorAll(".reply-input-container").forEach(el => el.classList.add("d-none"));
                const commentDiv = e.target.closest("[data-comment-id]");
                const inputContainer = commentDiv.querySelector(".reply-input-container");
                const input = inputContainer.querySelector(".reply-input");
                inputContainer.classList.remove("d-none");
                input.focus();
            }
        });

        commentsList.addEventListener("keydown", async (e) => {
            if (e.target.classList.contains("reply-input")) {
                if (e.key === "Escape") {
                    e.target.closest(".reply-input-container").classList.add("d-none");
                    e.target.value = "";
                } else if (e.key === "Enter") {
                    const text = e.target.value.trim();
                    const commentDiv = e.target.closest("[data-comment-id]");
                    const commentId = commentDiv.dataset.commentId;
                    
                    if (!text) return;
                    
                    e.target.disabled = true;
                    try {
                        const res = await fetch(`/api/posts/reply/${commentId}`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ text })
                        });
                        const data = await res.json();
                        if (data.flag === 1) {
                            e.target.value = "";
                            e.target.closest(".reply-input-container").classList.add("d-none");
                            
                            const reply = data.data.reply;
                            const repliesContainer = commentDiv.querySelector('.replies-container');
                            if (!repliesContainer.querySelector(`[data-reply-id="${reply._id}"]`)) {
                                const rHtml = `
                                    <div class="d-flex mt-2 ms-4" data-reply-id="${reply._id}">
                                        <a href="/profile/${reply.user.username}" class="flex-shrink-0">
                                            <img src="${reply.user.profilePicture || '/images/default-avatar.png'}" class="rounded-circle me-2" width="24" height="24" style="object-fit: cover;">
                                        </a>
                                        <div>
                                            <span class="fw-bold me-1">
                                                <a href="/profile/${reply.user.username}" class="text-decoration-none text-dark" style="font-size: 13px;">${reply.user.username}</a>
                                            </span>
                                            <span style="word-break: break-word; font-size: 13px;">${reply.text}</span>
                                            <div class="text-muted" style="font-size: 10px;">${new Date(reply.createdAt).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                `;
                                repliesContainer.insertAdjacentHTML('beforeend', rHtml);
                            }
                        } else {
                            if (window.showToast) window.showToast(data.message || "Failed to post reply", "danger");
                        }
                    } catch (error) {
                        console.error("Reply Error:", error);
                    } finally {
                        e.target.disabled = false;
                    }
                }
            }
        });
    }

    document.addEventListener("click", (e) => {
        if (!e.target.closest(".reply-input-container") && !e.target.classList.contains("reply-btn")) {
            document.querySelectorAll(".reply-input-container").forEach(el => {
                el.classList.add("d-none");
            });
        }
    });

    if (likeBtn) {
        likeBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            const icon = likeBtn.querySelector("i");

            try {
                const res = await fetch(`/api/posts/like/${postId}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" }
                });

                if (!res.ok) throw new Error("Failed to toggle like");

                const data = await res.json();
                if (data.flag === 1) {
                    const { likesCount, isLiked } = data.data;

                    if (isLiked) {
                        icon.classList.replace("bi-heart", "bi-heart-fill");
                        icon.classList.add("text-danger");
                    } else {
                        icon.classList.replace("bi-heart-fill", "bi-heart");
                        icon.classList.remove("text-danger");
                    }

                    if (likesCountEl) {
                        likesCountEl.textContent = `${likesCount} likes`;
                    }
                }
            } catch (error) {
                console.error("Like Error:", error);
            }
        });
    }

    if (deleteBtn) {
        deleteBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            const confirmDelete = window.showConfirm ? await window.showConfirm("Are you sure you want to delete this post?") : confirm("Are you sure you want to delete this post?");

            if (confirmDelete) {
                try {
                    const res = await fetch(`/api/posts/delete/${postId}`, { method: "DELETE" });
                    const data = await res.json();

                    if (data.flag === 1) {
                        if (window.showToast) window.showToast("Post deleted successfully", "success");
                        setTimeout(() => {
                            const username = document.querySelector('.details-username').textContent.trim();
                            window.location.href = `/profile/${username}`;
                        }, 1000);
                    } else {
                        if (window.showToast) window.showToast("Failed to delete", "danger");
                    }
                } catch (err) {
                    console.error("Delete Error:", err);
                }
            }
        });
    }
});

