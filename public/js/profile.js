document.addEventListener("DOMContentLoaded", () => {
    const followBtn = document.getElementById("followBtn");
    const statsDiv = document.querySelector(".profile-stats");
    const profileIsPrivate = statsDiv?.dataset.private === "true";
    const profileUserId = statsDiv?.dataset.userid;

    // --- Posts Logic ---
    const postsGrid = document.getElementById("postsGrid");
    const postTypeDropdown = document.getElementById("postTypeDropdown");
    const postTypeItems = document.querySelectorAll("#postTypeDropdown + .dropdown-menu .dropdown-item");
    const postModalMedia = document.getElementById("postModalMedia");
    const postsSection = document.getElementById("postsSection");
    const postsGridContainer = document.getElementById("postsGridContainer");
    const postsLoader = document.getElementById("postsLoader");
    const noMorePosts = document.getElementById("noMorePosts");

    let currentPostType = "posts";

    // --- Pagination State ---
    let currentPage = 1;
    const postsPerPage = 9;
    let totalPosts = 0;
    let isLoading = false;
    let allPostsLoaded = false;

    // --- Fetch posts with pagination ---
    const fetchPosts = async (page = 1, append = false) => {
        if (isLoading) return;
        isLoading = true;

        // Show loader
        if (postsLoader) postsLoader.classList.add("active");
        if (noMorePosts) noMorePosts.classList.remove("active");

        const username = window.location.pathname.split("/").pop();
        let url = `/post/user/${username}`;

        if (currentPostType === "drafts") {
            url = `/post/drafts`;
        } else if (currentPostType === "scheduled") {
            url = `/post/scheduled`;
        }

        // Add pagination params
        url += `?page=${page}&limit=${postsPerPage}`;

        try {
            const res = await fetch(url);
            const data = await res.json();

            if (data.flag === 1) {
                const posts = data.data.posts || data.data.drafts || [];
                totalPosts = data.data.total || 0;
                const totalPages = data.data.totalPages || 1;

                if (posts.length === 0 && page === 1) {
                    renderPosts([], false);
                    allPostsLoaded = true;
                } else if (posts.length === 0) {
                    allPostsLoaded = true;
                    if (noMorePosts) noMorePosts.classList.add("active");
                } else {
                    renderPosts(posts, append);

                    // Check if we've loaded all posts
                    if (page >= totalPages) {
                        allPostsLoaded = true;
                        if (noMorePosts && totalPosts > postsPerPage) {
                            noMorePosts.classList.add("active");
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Fetch Posts Error:", error);
        } finally {
            isLoading = false;
            if (postsLoader) postsLoader.classList.remove("active");
        }
    };

    const renderPosts = (posts, append = false) => {
        if (!postsGrid) return;

        if (posts.length === 0 && !append) {
            postsGrid.innerHTML = `
                <div class="col-12 text-center py-5 empty-posts">
                    <i class="bi ${currentPostType === 'posts' ? 'bi-image' : currentPostType === 'drafts' ? 'bi-file-earmark-text' : 'bi-calendar-event'} text-primary-custom display-4"></i>
                    <p class="mt-2 text-muted">No ${currentPostType} yet</p>
                </div>
            `;
            return;
        }

        const postsHTML = posts.map(post => {
            const mediaUrl = post.media && post.media.length > 0 ? post.media[0].url : '/images/default-post.png';
            const isVideo = post.media && post.media.length > 0 && post.media[0].type === "video";

            return `
            <div class="col-4">
                <div class="post-item position-relative overflow-hidden rounded-3 shadow-sm transition-all" style="aspect-ratio: 1/1; cursor: pointer;" data-post='${JSON.stringify(post).replace(/'/g, "&apos;")}'>
                    ${isVideo
                    ? `<video src="${mediaUrl}" style="width:100%; height:100%; object-fit: cover;"></video>`
                    : `<img src="${mediaUrl}" alt="Post" style="width:100%; height:100%; object-fit: cover;">`}
                    
                    ${post.media && post.media.length > 1 ? `
                        <div class="position-absolute top-0 end-0 m-2 mt-5">
                            <div class="bg-dark bg-opacity-75 rounded p-1 text-white" style="line-height:1;">
                                <i class="bi bi-stack" style="font-size: 0.8rem;"></i>
                            </div>
                        </div>
                    ` : ''}

                    ${currentPostType !== 'posts' ? `
                        <div class="position-absolute top-0 end-0 m-2">
                            <span class="badge bg-primary-custom rounded-pill px-2 py-1 shadow-sm">
                                <i class="bi ${currentPostType === 'drafts' ? 'bi-file-earmark-text' : 'bi-calendar-event'} me-1"></i>
                                ${currentPostType.charAt(0).toUpperCase() + currentPostType.slice(1, -1)}
                            </span>
                        </div>
                    ` : ''}
                    <div class="post-overlay position-absolute inset-0 d-flex align-items-center justify-content-center opacity-0 transition-all hover-opacity-100 bg-black bg-opacity-25 w-100 h-100 top-0 left-0">
                    </div>
                </div>
            </div>
            `;
        }).join("");

        if (append) {
            postsGrid.insertAdjacentHTML("beforeend", postsHTML);
        } else {
            postsGrid.innerHTML = postsHTML;
        }

        // Add click events to newly added post items
        const postItems = append
            ? postsGrid.querySelectorAll(".post-item:not([data-click-bound])")
            : postsGrid.querySelectorAll(".post-item");

        postItems.forEach(item => {
            item.setAttribute("data-click-bound", "true");
            item.addEventListener("click", (e) => {
                const post = JSON.parse(item.dataset.post);
                window.location.href = `/p/${post._id}`;
            });
        });
    };

    // --- Infinite Scroll (simple window-based) ---
    const setupScrollBehavior = () => {
        if (!postsGridContainer) return;

        // Throttled window scroll handler for infinite loading
        let scrollTicking = false;
        window.addEventListener("scroll", () => {
            if (scrollTicking || isLoading || allPostsLoaded) return;

            scrollTicking = true;
            requestAnimationFrame(() => {
                // Check if user has scrolled past 80% of the page
                const scrollTop = window.scrollY;
                const docHeight = document.documentElement.scrollHeight;
                const winHeight = window.innerHeight;
                const scrollPercent = (scrollTop + winHeight) / docHeight;

                if (scrollPercent >= 0.8) {
                    currentPage++;
                    fetchPosts(currentPage, true);
                }
                scrollTicking = false;
            });
        });
    };

    // openPostModal and modal related logic has been removed as we navigate to /p/:postId now

    // Reset pagination and refetch
    const resetAndFetch = () => {
        currentPage = 1;
        allPostsLoaded = false;
        if (noMorePosts) noMorePosts.classList.remove("active");
        fetchPosts(1, false);
    };

    // Dropdown change logic
    if (postTypeDropdown) {
        postTypeItems.forEach(item => {
            item.addEventListener("click", (e) => {
                e.preventDefault();
                const type = item.dataset.type;
                currentPostType = type;

                // Update UI
                postTypeDropdown.textContent = item.textContent;
                postTypeItems.forEach(i => i.classList.remove("active"));
                item.classList.add("active");

                resetAndFetch();
            });
        });
    }

    // Initial load
    if (postsGrid && (!profileIsPrivate || followBtn === null || (followBtn && followBtn.dataset.following === "true"))) {
        fetchPosts(1, false);
        setupScrollBehavior();
    } else if (postsGrid && profileIsPrivate && followBtn !== null && followBtn.dataset.following === "false") {
        // Handled by EJS initially
    }

    if (followBtn) {
        followBtn.addEventListener("click", async () => {
            const userId = followBtn.dataset.id;
            const isFollowing = followBtn.dataset.following === "true";

            try {
                if (!isFollowing) {
                    const res = await fetch(`/profile/follow/${userId}`, {
                        method: "POST",
                        credentials: "same-origin",
                        headers: { "Content-Type": "application/json" }
                    });
                    const data = await res.json();

                    if (data.flag !== 1) {
                        return showToast(data.msg || "Failed to follow", "danger");
                    }

                    if (profileIsPrivate) {
                        followBtn.textContent = "Requested";
                        followBtn.dataset.following = "false";
                        statsDiv.innerHTML = `
                            <div class="stat-item">
                                <strong>${data.data.followersCount}</strong>
                                <span>Followers</span>
                            </div>
                            <div class="stat-item">
                                <strong>${data.data.followingCount}</strong>
                                <span>Following</span>
                            </div>
                        `;
                    } else {
                        followBtn.textContent = "Unfollow";
                        followBtn.dataset.following = "true";
                        statsDiv.innerHTML = `
                            <a href="/profile/${profileUserId}/connections?type=followers" class="stat-item">
                                <strong>${data.data.followersCount}</strong>
                                <span>Followers</span>
                            </a>
                            <a href="/profile/${profileUserId}/connections?type=following" class="stat-item">
                                <strong>${data.data.followingCount}</strong>
                                <span>Following</span>
                            </a>
                        `;
                    }
                    showToast(data.msg || "Success!", "success");
                } else {
                    const res = await fetch(`/profile/unfollow/${userId}`, {
                        method: "DELETE",
                        credentials: "same-origin",
                        headers: { "Content-Type": "application/json" }
                    });
                    const data = await res.json();

                    if (data.flag !== 1) {
                        return showToast(data.msg || "Failed to unfollow", "danger");
                    }

                    followBtn.textContent = "Follow";
                    followBtn.dataset.following = "false";

                    if (profileIsPrivate) {
                        statsDiv.innerHTML = `
                            <div class="stat-item">
                                <strong>${data.data.followersCount}</strong>
                                <span>Followers</span>
                            </div>
                            <div class="stat-item">
                                <strong>${data.data.followingCount}</strong>
                                <span>Following</span>
                            </div>
                        `;
                    } else {
                        statsDiv.innerHTML = `
                            <a href="/profile/${profileUserId}/connections?type=followers" class="stat-item">
                                <strong>${data.data.followersCount}</strong>
                                <span>Followers</span>
                            </a>
                            <a href="/profile/${profileUserId}/connections?type=following" class="stat-item">
                                <strong>${data.data.followingCount}</strong>
                                <span>Following</span>
                            </a>
                        `;
                    }
                    showToast(data.msg || "Unfollowed!", "success");
                }
            } catch (error) {
                console.error("Error:", error);
                showToast("An error occurred. Please try again.", "danger");
            }
        });
    }
});