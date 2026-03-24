document.addEventListener("DOMContentLoaded", () => {
    const feedPostsContainer = document.getElementById("feedPosts");
    const feedLoader = document.getElementById("feedLoader");
    const noMoreFeedPosts = document.getElementById("noMoreFeedPosts");

    if (!feedPostsContainer) return;

    let currentPage = 1;
    const postsPerPage = 5;
    let isLoading = false;
    let allPostsLoaded = false;

    // Time formatting helper (e.g., "2 HOURS AGO", "1 DAY AGO")
    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 7) return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
        if (days > 0) return `${days} DAY${days > 1 ? 'S' : ''} AGO`;
        if (hours > 0) return `${hours} HOUR${hours > 1 ? 'S' : ''} AGO`;
        if (minutes > 0) return `${minutes} MINUTE${minutes > 1 ? 'S' : ''} AGO`;
        return "JUST NOW";
    };

    // Render a single post card
    const renderPostCard = (post) => {
        const profilePicUrl = post.userProfilePic || "/images/default-avatar.png";

        let mediaHtml = "";
        if (post.media && post.media.length > 0) {
            // Simplified: just render the first media item for now, or build a carousel
            // Taking inspiration from the profile modal logic:
            if (post.media.length === 1) {
                const item = post.media[0];
                if (item.type === "image") {
                    mediaHtml = `<img src="${item.url}" class="feed-media-item" alt="Post media">`;
                } else if (item.type === "video") {
                    mediaHtml = `<video src="${item.url}" class="feed-media-item" controls loop muted autoplay></video>`;
                }
            } else {
                // Carousel implementation (reusing Bootstrap)
                const carouselId = `carousel-${post._id}`;
                const indicators = post.media.map((_, i) =>
                    `<button type="button" data-bs-target="#${carouselId}" data-bs-slide-to="${i}" class="${i === 0 ? 'active' : ''}"></button>`
                ).join("");

                const inner = post.media.map((item, i) => {
                    const mediaElement = item.type === "image"
                        ? `<img src="${item.url}" class="d-block w-100 feed-media-item" alt="Post media">`
                        : `<video src="${item.url}" class="d-block w-100 feed-media-item" controls loop muted autoplay></video>`;
                    return `<div class="carousel-item ${i === 0 ? 'active' : ''}">${mediaElement}</div>`;
                }).join("");

                mediaHtml = `
                    <div id="${carouselId}" class="carousel slide" data-bs-ride="false" data-bs-wrap="false" data-bs-interval="false">
                        <div class="carousel-indicators">${indicators}</div>
                        <div class="carousel-inner">${inner}</div>
                        <button class="carousel-control-prev" type="button" data-bs-target="#${carouselId}" data-bs-slide="prev">
                            <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                            <span class="visually-hidden">Previous</span>
                        </button>
                        <button class="carousel-control-next" type="button" data-bs-target="#${carouselId}" data-bs-slide="next">
                            <span class="carousel-control-next-icon" aria-hidden="true"></span>
                            <span class="visually-hidden">Next</span>
                        </button>
                    </div>`;
            }
        }

        const locationHtml = post.location ? `<div class="feed-location">${post.location}</div>` : "";

        const cardHtml = `
            <article class="feed-post-card" id="post-${post._id}">
                <header class="feed-header">
                    <a href="/profile/${post.user.username}">
                        <img src="${profilePicUrl}" alt="Profile picture" class="feed-avatar">
                    </a>
                    <div class="feed-user-info">
                        <a href="/profile/${post.user.username}" class="feed-username">${post.user.username}</a>
                        ${locationHtml}
                    </div>
                </header>
                
                <div class="feed-media-container">
                    ${mediaHtml}
                </div>

                <div class="feed-actions d-flex align-items-center">
                    <button class="feed-action-btn like-btn d-flex align-items-center me-3" data-id="${post._id}" style="border: none; background: none; padding: 0;">
                        <i class="bi ${post.isLiked ? 'bi-heart-fill text-danger' : 'bi-heart'}" style="font-size: 24px;"></i>
                        <span class="text-dark ms-2" id="likes-count-${post._id}" style="font-size: 14px; font-weight: 600;">${post.likesCount || 0}</span>
                    </button>
                    <a href="/p/${post._id}" class="feed-action-btn comment-btn text-decoration-none text-dark d-flex align-items-center me-3" data-id="${post._id}" style="border: none; background: none; padding: 0;">
                        <i class="bi bi-chat" style="font-size: 24px;"></i>
                        <span class="text-dark ms-2" style="font-size: 14px; font-weight: 600;">${post.commentsCount || 0}</span>
                    </a>
                    <button class="feed-action-btn share-btn" data-id="${post._id}">
                        <i class="bi bi-send"></i>
                    </button>
                    <button class="feed-action-btn bookmark-btn ms-auto" data-id="${post._id}">
                        <i class="bi bi-bookmark"></i>
                    </button>
                </div>

                <div class="feed-caption-area">
                    <a href="/profile/${post.user.username}" class="feed-caption-username">${post.user.username}</a>
                    <span class="feed-caption-text">${post.caption}</span>
                </div>

                ${post.topComments ? post.topComments.map(c => `
                    <div class="feed-top-comment my-1 px-3">
                        <a href="/profile/${c.user.username}" class="text-decoration-none text-dark" style="font-weight: 500;">${c.user.username}</a>
                        <span class="ms-1">${c.text}</span>
                    </div>
                `).join('') : ''}

                ${post.commentsCount > 2 ? `<a href="/p/${post._id}" class="feed-comments-link d-block mt-1 text-muted text-decoration-none px-3">View all ${post.commentsCount} comments</a>` : ""}
                
                <div class="feed-timestamp">
                    ${formatTimeAgo(post.createdAt)}
                </div>
            </article>
        `;

        const template = document.createElement("template");
        template.innerHTML = cardHtml.trim();
        return template.content.firstChild;
    };

    // Fetch posts function
    const fetchFeedPosts = async (page = 1) => {
        if (isLoading || allPostsLoaded) return;

        isLoading = true;
        feedLoader.classList.add("active");

        try {
            const res = await fetch(`/api/feed?page=${page}&limit=${postsPerPage}`);
            if (!res.ok) throw new Error("Failed to fetch");

            const data = await res.json();

            if (data.flag === 1) {
                const posts = data.data.posts;

                if (posts.length === 0) {
                    allPostsLoaded = true;
                    if (page === 1) {
                        feedPostsContainer.innerHTML = `
                            <div class="text-center text-muted mt-5 mb-5 p-5">
                                <i class="bi bi-camera" style="font-size: 3rem;"></i>
                                <h4 class="mt-3">Welcome to your feed!</h4>
                                <p>Follow users to see their latest posts here.</p>
                                <a href="/create-post" class="btn btn-primary mt-2">Create a Post</a>
                            </div>
                        `;
                        feedLoader.classList.remove("active");
                        noMoreFeedPosts.classList.remove("active");
                    } else {
                        noMoreFeedPosts.classList.add("active");
                    }
                } else {
                    // Append posts
                    posts.forEach(post => {
                        const card = renderPostCard(post);
                        feedPostsContainer.appendChild(card);

                        // Join the post room for real-time updates
                        if (window.joinPostRoom) {
                            window.joinPostRoom(post._id);
                        }
                    });

                    // One-time listener for feed updates
                    if (window.socket && !window.feedSocketInitialized) {
                        window.feedSocketInitialized = true;
                        
                        window.socket.on("post:liked", (data) => {
                            const likesCountElement = document.getElementById(`likes-count-${data.postId || data.post}`);
                            if (likesCountElement) {
                                likesCountElement.textContent = `${data.likesCount} likes`;
                            }
                        });

                        window.socket.on("post:unliked", (data) => {
                            const likesCountElement = document.getElementById(`likes-count-${data.postId || data.post}`);
                            if (likesCountElement) {
                                likesCountElement.textContent = `${data.likesCount} likes`;
                            }
                        });
                    }


                    if (posts.length < postsPerPage) {
                        allPostsLoaded = true;
                        noMoreFeedPosts.classList.add("active");
                    }
                }
            } else {
                console.error("Error from API:", data.msg);
                showToast && showToast("Failed to load feed", "danger");
            }
        } catch (error) {
            console.error("Error fetching feed:", error);
            showToast && showToast("Network error. Please try again.", "danger");
        } finally {
            isLoading = false;
            feedLoader.classList.remove("active");
            if (allPostsLoaded && page > 1) {
                // Show the 'no more posts' indicator
                noMoreFeedPosts.classList.add("active");
            }
        }
    };

    // Infinite Scroll Implementation
    const setupInfiniteScroll = () => {
        let scrollTicking = false;

        window.addEventListener("scroll", () => {
            if (scrollTicking || isLoading || allPostsLoaded) return;

            scrollTicking = true;
            requestAnimationFrame(() => {
                const scrollTop = window.scrollY;
                const docHeight = document.documentElement.scrollHeight;
                const winHeight = window.innerHeight;
                const scrollPercent = (scrollTop + winHeight) / docHeight;

                // Load more when user scrolls past 80% marks
                if (scrollPercent >= 0.8) {
                    currentPage++;
                    fetchFeedPosts(currentPage);
                }
                scrollTicking = false;
            });
        });
    };

    // Initialize
    fetchFeedPosts(1);
    setupInfiniteScroll();

    feedPostsContainer.addEventListener("click", async (e) => {
        const likeBtn = e.target.closest(".like-btn");
        if (likeBtn) {
            e.preventDefault();
            const postId = likeBtn.dataset.id;
            const icon = likeBtn.querySelector("i");
            const likesCountElement = document.getElementById(`likes-count-${postId}`);

            try {
                const res = await fetch(`/api/posts/like/${postId}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" }
                });

                if (!res.ok) throw new Error("Failed to toggle like");

                const data = await res.json();
                if (data.flag === 1) {
                    const { likesCount, isLiked } = data.data;

                    // Update Icon
                    if (isLiked) {
                        icon.classList.replace("bi-heart", "bi-heart-fill");
                        icon.classList.add("text-danger");
                    } else {
                        icon.classList.replace("bi-heart-fill", "bi-heart");
                        icon.classList.remove("text-danger");
                    }

                    // Update Count
                    if (likesCountElement) {
                        likesCountElement.textContent = `${likesCount} likes`;
                    }
                }
            } catch (error) {
                console.error("Like Error:", error);
                // showToast && showToast("Error liking post", "danger");
            }
        }
    });
});
