document.addEventListener("DOMContentLoaded", () => {
    const storiesTray = document.getElementById("storiesTray");
    const storyViewer = document.getElementById("storyViewer");
    const closeBtn = document.getElementById("closeStoryViewer");
    const addStoryBtn = document.getElementById("addStoryBtn");

    const progressBarContainer = document.getElementById("storyProgressContainer");
    const storyUserImg = document.getElementById("storyUserImg");
    const storyUserName = document.getElementById("storyUserName");
    const storyMediaImg = document.getElementById("storyMediaImg");
    const storyMediaVid = document.getElementById("storyMediaVid");
    const navPrev = document.getElementById("storyNavPrev");
    const navNext = document.getElementById("storyNavNext");

    // Viewer Count & List Elements
    const storyFooter = document.getElementById("storyFooter");
    const viewersCountBtn = document.getElementById("viewersCountBtn");
    const viewerCountText = document.getElementById("viewerCountText");
    const viewersListOverlay = document.getElementById("viewersListOverlay");
    const viewersListContent = document.getElementById("viewersListContent");
    const closeViewersListBtn = document.getElementById("closeViewersList");

    let allStoriesGrouped = []; // [{ user: {}, stories: [] }]
    let currentUserGroupIndex = 0;
    let currentStoryIndex = 0;
    let storyTimer = null;
    let progressInterval = null;
    let storyItemElements = []; // Store references to story items in tray
    const STORY_DURATION = 5000; // 5 seconds

    // --- Fetch and Render Stories ---
    async function fetchStories() {
        try {
            const res = await fetch("/api/stories");
            const data = await res.json();
            if (data.flag === 1) {
                allStoriesGrouped = data.data;
                renderStoriesTray();
            }
        } catch (error) {
            console.error("Fetch Stories Error:", error);
        }
    }

    function renderStoriesTray() {
        const feedContainer = document.querySelector(".feed-page-container");
        const currentUserId = feedContainer ? feedContainer.getAttribute("data-user-id") : null;
        
        const addStoryBtn = document.getElementById("addStoryBtn");
        const currentUserWrapper = document.getElementById("currentUserStoryWrapper");
        
        // Remove existing "other" story items
        const existingOthers = storiesTray.querySelectorAll(".story-item:not(#addStoryBtn)");
        existingOthers.forEach(el => el.remove());

        let currentUserGroupIdx = -1;
        
        storyItemElements = [];
        allStoriesGrouped.forEach((group, index) => {
            const isCurrentUser = currentUserId && group.user._id.toString() === currentUserId;
            
            if (isCurrentUser) {
                currentUserGroupIdx = index;
                currentUserWrapper.classList.remove("no-stories");
                if (group.isViewed) {
                    currentUserWrapper.classList.add("viewed");
                } else {
                    currentUserWrapper.classList.remove("viewed");
                }
                addStoryBtn.onclick = () => openStoryViewer(index);
                storyItemElements[index] = currentUserWrapper;
            } else {
                const item = document.createElement("div");
                item.className = "story-item";
                const wrapperClass = group.isViewed ? 'story-avatar-wrapper viewed' : 'story-avatar-wrapper';
                item.innerHTML = `
                    <div class="${wrapperClass}">
                        <img src="${group.user.profilePicture || '/images/default-avatar.png'}" alt="${group.user.username}">
                    </div>
                    <span class="story-username">${group.user.username}</span>
                `;
                item.onclick = () => openStoryViewer(index);
                storiesTray.appendChild(item);
                storyItemElements[index] = item.querySelector(".story-avatar-wrapper");
            }
        });

        // If current user has no stories, ensure click triggers redirect to create page
        if (currentUserGroupIdx === -1) {
            currentUserWrapper.classList.add("no-stories");
            addStoryBtn.onclick = () => window.location.href = "/create-story";
        }
    }

    // --- Story Viewer Logic ---
    function openStoryViewer(groupIndex) {
        currentUserGroupIndex = groupIndex;
        currentStoryIndex = 0;
        storyViewer.classList.add("active");
        showStory();
    }

    function closeStoryViewer() {
        storyViewer.classList.remove("active");
        viewersListOverlay.classList.remove("active");
        clearStoryTimers();
        if (storyMediaVid) storyMediaVid.pause();
    }

    function showStory() {
        clearStoryTimers();

        const group = allStoriesGrouped[currentUserGroupIndex];
        if (!group) return closeStoryViewer();

        const story = group.stories[currentStoryIndex];
        if (!story) {
            if (currentUserGroupIndex < allStoriesGrouped.length - 1) {
                currentUserGroupIndex++;
                currentStoryIndex = 0;
                return showStory();
            } else {
                return closeStoryViewer();
            }
        }

        // Update UI
        storyUserImg.src = group.user.profilePicture || '/images/default-avatar.png';
        storyUserName.textContent = group.user.username;

        // Reset progress bars
        progressBarContainer.innerHTML = "";
        group.stories.forEach((_, idx) => {
            const barBg = document.createElement("div");
            barBg.className = "progress-bar-bg";
            const barFill = document.createElement("div");
            barFill.className = "progress-bar-fill";
            
            if (idx < currentStoryIndex) {
                barFill.style.width = "100%";
            } else if (idx === currentStoryIndex) {
                barFill.id = "activeProgressFill";
            }
            
            barBg.appendChild(barFill);
            progressBarContainer.appendChild(barBg);
        });

        // Load Media
        if (story.type === "video") {
            storyMediaImg.classList.add("d-none");
            storyMediaVid.classList.remove("d-none");
            storyMediaVid.src = story.mediaUrl;
            storyMediaVid.play();
        } else {
            storyMediaVid.classList.add("d-none");
            storyMediaImg.classList.remove("d-none");
            storyMediaImg.src = story.mediaUrl;
        }

        // Show viewer count if it's current user's story
        const feedContainer = document.querySelector(".feed-page-container");
        const currentUserId = feedContainer ? feedContainer.getAttribute("data-user-id") : null;
        
        if (currentUserId && group.user._id.toString() === currentUserId) {
            storyFooter.classList.remove("d-none");
            const count = story.viewerCount || 0;
            viewerCountText.textContent = `${count} ${count === 1 ? 'viewer' : 'viewers'}`;
            viewersCountBtn.onclick = () => openViewersList(story._id);
        } else {
            storyFooter.classList.add("d-none");
        }

        // Mark story as viewed in backend
        markStoryViewed(story._id);

        // Start Progress Animation
        const activeFill = document.getElementById("activeProgressFill");
        let start = Date.now();
        
        progressInterval = setInterval(() => {
            let elapsed = Date.now() - start;
            let progress = (elapsed / STORY_DURATION) * 100;
            if (progress >= 100) {
                progress = 100;
                clearInterval(progressInterval);
            }
            if (activeFill) activeFill.style.width = progress + "%";
        }, 30);

        storyTimer = setTimeout(nextStory, STORY_DURATION);
    }

    function nextStory() {
        const group = allStoriesGrouped[currentUserGroupIndex];
        if (currentStoryIndex < group.stories.length - 1) {
            currentStoryIndex++;
            showStory();
        } else if (currentUserGroupIndex < allStoriesGrouped.length - 1) {
            currentUserGroupIndex++;
            currentStoryIndex = 0;
            showStory();
        } else {
            closeStoryViewer();
        }
    }

    function prevStory() {
        if (currentStoryIndex > 0) {
            currentStoryIndex--;
            showStory();
        } else if (currentUserGroupIndex > 0) {
            currentUserGroupIndex--;
            currentStoryIndex = allStoriesGrouped[currentUserGroupIndex].stories.length - 1;
            showStory();
        } else {
            showStory();
        }
    }

    function clearStoryTimers() {
        if (storyTimer) clearTimeout(storyTimer);
        if (progressInterval) clearInterval(progressInterval);
    }

    async function markStoryViewed(storyId) {
        try {
            await fetch(`/api/stories/${storyId}/view`, { method: "POST" });
            
            // Update local state and UI
            const group = allStoriesGrouped[currentUserGroupIndex];
            if (group) {
                const story = group.stories[currentStoryIndex];
                // Increment viewer count locally if not already viewed by current user (though it's unlikely to be owner viewing it for the first time)
                // Actually, backend markStoryViewed handles it. 
                
                if (!group.isViewed) {
                    if (currentStoryIndex === group.stories.length - 1) {
                        group.isViewed = true;
                        if (storyItemElements[currentUserGroupIndex]) {
                            storyItemElements[currentUserGroupIndex].classList.add("viewed");
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error marking story as viewed:", error);
        }
    }

    // --- Viewers List Logic ---
    async function openViewersList(storyId) {
        // Pause timer
        clearStoryTimers();
        if (storyMediaVid) storyMediaVid.pause();

        viewersListOverlay.classList.add("active");
        viewersListContent.innerHTML = '<div class="text-center p-4"><div class="spinner-border spinner-border-sm" role="status"></div></div>';

        try {
            const res = await fetch(`/api/stories/${storyId}/viewers`);
            const data = await res.json();
            
            if (data.flag === 1) {
                renderViewersList(data.data);
            } else {
                viewersListContent.innerHTML = `<div class="text-center p-4 text-muted">${data.message || 'Error fetching viewers'}</div>`;
            }
        } catch (error) {
            console.error("Fetch Viewers Error:", error);
            viewersListContent.innerHTML = '<div class="text-center p-4 text-muted">Error fetching viewers</div>';
        }
    }

    function renderViewersList(viewers) {
        if (!viewers || viewers.length === 0) {
            viewersListContent.innerHTML = '<div class="text-center p-4 text-muted">No viewers yet</div>';
            return;
        }

        viewersListContent.innerHTML = viewers.map(viewer => `
            <a href="/profile/${viewer.username}" class="viewer-item">
                <img src="${viewer.profilePicture || '/images/default-avatar.png'}" alt="${viewer.username}" class="viewer-avatar">
                <div class="viewer-info">
                    <span class="viewer-username">${viewer.username}</span>
                    <span class="viewer-fullname">${viewer.fullname || ''}</span>
                </div>
            </a>
        `).join('');
    }

    function closeViewersList() {
        viewersListOverlay.classList.remove("active");
        // Resume story - we just restart the current story
        showStory();
    }

    // --- Event Listeners ---
    closeBtn.onclick = closeStoryViewer;
    navNext.onclick = (e) => { e.stopPropagation(); nextStory(); };
    navPrev.onclick = (e) => { e.stopPropagation(); prevStory(); };
    closeViewersListBtn.onclick = (e) => { e.stopPropagation(); closeViewersList(); };

    // Initial Fetch
    fetchStories();
});
