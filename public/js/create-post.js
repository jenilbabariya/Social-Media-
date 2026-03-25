document.addEventListener("DOMContentLoaded", () => {
    // --- Elements ---
    const mediaInput = document.getElementById("mediaInput");
    const dropZone = document.getElementById("dropZone");
    const previewSection = document.getElementById("previewSection");
    const carouselInner = document.getElementById("carouselInner");
    const maxFilesWarning = document.getElementById("maxFilesWarning");
    const scheduleSwitch = document.getElementById("scheduleSwitch");
    const scheduleOptions = document.getElementById("scheduleOptions");
    const publishAtInput = document.getElementById("publishAt");
    const submitBtn = document.getElementById("submitBtn");
    const saveDraftBtn = document.getElementById("saveDraftBtn");
    const createPostForm = document.getElementById("createPostForm");
    const thumbnailsContainer = document.getElementById("thumbnailsContainer");
    const existingPostDataEl = document.getElementById("existingPostData");
    const existingPost = (existingPostDataEl && existingPostDataEl.dataset.post !== "null") ? JSON.parse(existingPostDataEl.dataset.post) : null;

    let selectedFiles = []; // to hold File objects
    let existingMedia = existingPost ? existingPost.media : [];

    if (existingPost) {
        if (existingPost.status === 'scheduled' && existingPost.publishAt) {
            scheduleSwitch.checked = true;
            scheduleOptions.classList.remove("d-none");
            const date = new Date(existingPost.publishAt);
            const tzoffset = date.getTimezoneOffset() * 60000;
            const localISOTime = (new Date(date - tzoffset)).toISOString().slice(0, 16);
            publishAtInput.value = localISOTime;
            submitBtn.textContent = "Update Schedule";
        }
        renderPreview();
    }

    // --- Time Validation for Schedule ---
    function updateMinTime() {
        const now = new Date();
        // Round to next 5 minutes
        let mins = now.getMinutes();
        const remainder = mins % 5;
        now.setMinutes(mins + (5 - remainder));

        const tzoffset = (new Date()).getTimezoneOffset() * 60000;
        const localISOTime = (new Date(now - tzoffset)).toISOString().slice(0, 16);
        publishAtInput.min = localISOTime;
    }

    // Initialize min time and listener to keep it updated
    updateMinTime();
    publishAtInput.addEventListener('focus', updateMinTime);

    // --- Schedule Switch Toggle ---
    scheduleSwitch.addEventListener("change", (e) => {
        if (e.target.checked) {
            scheduleOptions.classList.remove("d-none");
            submitBtn.textContent = existingPost ? "Update Schedule" : "Schedule";
            publishAtInput.required = true;
        } else {
            scheduleOptions.classList.add("d-none");
            submitBtn.textContent = existingPost ? "Update Post" : "Post Now";
            publishAtInput.value = "";
            publishAtInput.required = false;
        }
    });

    // --- Drag and Drop & File Upload Logic ---
    if (dropZone) {
        dropZone.addEventListener("click", () => mediaInput.click());

        dropZone.addEventListener("dragover", (e) => {
            e.preventDefault();
            dropZone.style.backgroundColor = "#e9ecef";
            dropZone.style.borderColor = "#0d6efd";
        });

        dropZone.addEventListener("dragleave", () => {
            dropZone.style.backgroundColor = "";
            dropZone.style.borderColor = "";
        });

        dropZone.addEventListener("drop", (e) => {
            e.preventDefault();
            dropZone.style.backgroundColor = "";
            dropZone.style.borderColor = "";

            if (e.dataTransfer.files.length > 0) {
                handleFiles(e.dataTransfer.files);
            }
        });
    }

    if (mediaInput) {
        mediaInput.addEventListener("change", (e) => {
            if (e.target.files.length > 0) {
                handleFiles(e.target.files);
            }
        });
    }

    function handleFiles(files) {
        const newFiles = Array.from(files);
        selectedFiles = [...selectedFiles, ...newFiles];

        // If user uploads new files, we clear existing ones (all or nothing replacement for now)
        existingMedia = [];

        // Cap at 10 files
        if (selectedFiles.length > 10) {
            selectedFiles = selectedFiles.slice(0, 10);
            maxFilesWarning.classList.remove("d-none");
        } else {
            maxFilesWarning.classList.add("d-none");
        }

        renderPreview();

        // Reset the file input to ensure the 'change' event fires if the same file is selected again
        mediaInput.value = "";
    }

    function renderPreview() {
        const totalItems = selectedFiles.length + existingMedia.length;

        if (totalItems === 0) {
            previewSection.classList.add("d-none");
            if (dropZone) dropZone.classList.remove("d-none");
            return;
        }

        previewSection.classList.remove("d-none");
        if (dropZone) dropZone.classList.add("d-none");

        carouselInner.innerHTML = "";

        // Render Existing Media
        existingMedia.forEach((m, index) => {
            const itemDiv = document.createElement("div");
            itemDiv.className = `carousel-item h-100 ${index === 0 ? "active" : ""}`;

            if (m.type === "image") {
                itemDiv.innerHTML = `<img src="${m.url}" class="d-block w-100 h-100" style="object-fit: contain;">`;
            } else {
                itemDiv.innerHTML = `<video src="${m.url}" class="d-block w-100 h-100 bg-black" controls></video>`;
            }

            if (!existingPost || existingPost.status !== 'published') {
                const removeBtn = document.createElement("button");
                removeBtn.innerHTML = '<i class="bi bi-trash"></i>';
                removeBtn.className = "btn btn-danger position-absolute top-0 start-0 m-2 btn-sm";
                removeBtn.style.zIndex = "10";
                removeBtn.onclick = (e) => {
                    e.preventDefault();
                    existingMedia.splice(index, 1);
                    renderPreview();
                };
                itemDiv.appendChild(removeBtn);
            }

            carouselInner.appendChild(itemDiv);
        });

        // Render New Files
        selectedFiles.forEach((file, index) => {
            const itemDiv = document.createElement("div");
            itemDiv.className = `carousel-item h-100 ${(existingMedia.length === 0 && index === 0) ? "active" : ""}`;

            const url = URL.createObjectURL(file);
            const isImage = file.type.startsWith("image/") || !!file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i);
            const isVideo = file.type.startsWith("video/") || !!file.name.match(/\.(mp4|webm|ogg|mov)$/i);

            if (isImage) {
                const img = document.createElement("img");
                img.src = url;
                img.className = "d-block w-100 h-100";
                img.style.objectFit = "contain";
                itemDiv.appendChild(img);
            } else if (isVideo) {
                const video = document.createElement("video");
                video.src = url;
                video.className = "d-block w-100 h-100 bg-black";
                video.controls = true;
                itemDiv.appendChild(video);
            }

            const removeBtn = document.createElement("button");
            removeBtn.innerHTML = '<i class="bi bi-trash"></i>';
            removeBtn.className = "btn btn-danger position-absolute top-0 start-0 m-2 btn-sm";
            removeBtn.style.zIndex = "10";
            removeBtn.onclick = (e) => {
                e.preventDefault();
                selectedFiles.splice(index, 1);
                renderPreview();
            };
            itemDiv.appendChild(removeBtn);

            carouselInner.appendChild(itemDiv);
        });

        renderThumbnails();

        const carouselEl = document.getElementById("mediaCarousel");
        if (!carouselEl) return;
        const existingOverlay = carouselEl.querySelector(".add-more-overlay");
        if (existingOverlay) existingOverlay.remove();

        if (totalItems < 10 && (!existingPost || existingPost.status !== 'published')) {
            const addMoreOverlay = document.createElement("button");
            addMoreOverlay.type = "button";
            addMoreOverlay.className = "btn btn-light position-absolute top-0 end-0 m-2 btn-sm add-more-overlay";
            addMoreOverlay.style.zIndex = "10";
            addMoreOverlay.innerHTML = '<i class="bi bi-plus-circle"></i> Add More';
            addMoreOverlay.onclick = () => {
                if (mediaInput) mediaInput.click();
            };
            carouselEl.appendChild(addMoreOverlay);
        }
    }

    function renderThumbnails() {
        if (!thumbnailsContainer) return;
        thumbnailsContainer.innerHTML = "";

        const allMedia = [
            ...existingMedia.map(m => ({ url: m.url, type: m.type })),
            ...selectedFiles.map(file => ({ url: URL.createObjectURL(file), type: file.type.startsWith("video") ? "video" : "image" }))
        ];

        allMedia.forEach((m, index) => {
            const thumb = document.createElement("div");
            thumb.className = "thumbnail-item position-relative rounded overflow-hidden";
            thumb.style = "width: 60px; height: 60px; flex-shrink: 0; cursor: pointer; border: 2px solid transparent;";

            if (index === 0) thumb.style.borderColor = "#0d6efd";

            if (m.type === "video" || (typeof m.type === 'string' && m.type.includes("video"))) {
                thumb.innerHTML = `<video src="${m.url}" style="width: 100%; height: 100%; object-fit: cover;"></video>`;
            } else {
                thumb.innerHTML = `<img src="${m.url}" style="width: 100%; height: 100%; object-fit: cover;">`;
            }

            thumb.onclick = () => {
                const carouselEl = document.getElementById('mediaCarousel');
                if (carouselEl) {
                    const carousel = bootstrap.Carousel.getOrCreateInstance(carouselEl);
                    carousel.to(index);
                }
                document.querySelectorAll(".thumbnail-item").forEach(t => t.style.borderColor = "transparent");
                thumb.style.borderColor = "#0d6efd";
            };

            thumbnailsContainer.appendChild(thumb);
        });
    }

    // --- Form Submission ---
    async function submitForm(isDraft = false) {
        const isEdit = createPostForm.dataset.edit === "true";
        const postId = createPostForm.dataset.postid;

        if (!isDraft && !isEdit && selectedFiles.length === 0) {
            showToast("Please upload at least one image or video.", "danger");
            return;
        }

        const formData = new FormData(createPostForm);
        formData.delete("postMedia");
        selectedFiles.forEach(file => {
            formData.append("postMedia", file);
        });

        const isScheduled = scheduleSwitch.checked;
        let endpoint = isEdit ? `/api/posts/edit/${postId}` : "/api/posts/create";
        let method = isEdit ? "PUT" : "POST";

        // Determine endpoint
        if (isDraft) {
            endpoint = isEdit ? `/api/posts/edit/${postId}?status=draft` : "/api/posts/draft";
            // Check if we need a specific 'update draft' route, assuming editPost handles it via status
        }

        if (isScheduled && !isDraft) {
            const time = publishAtInput.value;
            if (!time) {
                showToast("Please select a valid scheduled time.", "danger");
                return;
            }
            const selectedTime = new Date(time);
            if (selectedTime.getMinutes() % 5 !== 0) {
                showToast("Please select a time in 5-minute intervals.", "danger");
                return;
            }
            endpoint = isEdit ? `/api/posts/edit/${postId}?status=scheduled` : "/api/posts/schedule";
        }

        // Send Request
        submitBtn.disabled = true;
        if (saveDraftBtn) saveDraftBtn.disabled = true;

        try {
            const res = await fetch(endpoint, {
                method: method,
                body: formData
            });

            const data = await res.json();

            if (res.ok) {
                showToast(data.msg || "Success!", "success");
                setTimeout(() => {
                    window.location.href = "/dashboard";
                }, 1500);
            } else {
                showToast(data.msg || "An error occurred.", "danger");
            }
        } catch (error) {
            console.error(error);
            showToast("Error submitting form.", "danger");
        } finally {
            submitBtn.disabled = false;
            if (saveDraftBtn) saveDraftBtn.disabled = false;
        }
    }

    createPostForm.addEventListener("submit", (e) => {
        e.preventDefault();
        submitForm(false);
    });

    if (saveDraftBtn) {
        saveDraftBtn.addEventListener("click", () => {
            submitForm(true);
        });
    }
});
