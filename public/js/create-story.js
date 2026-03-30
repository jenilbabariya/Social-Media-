document.addEventListener("DOMContentLoaded", () => {
    const dropZone = document.getElementById("dropZone");
    const mediaInput = document.getElementById("storyMediaInput");
    const previewContainer = document.getElementById("previewContainer");
    const storyPreview = document.getElementById("storyPreview");
    const publishBtn = document.getElementById("publishStoryBtn");
    const loader = document.getElementById("uploadLoader");

    // Click to upload
    dropZone.onclick = () => mediaInput.click();

    // Handle file selection
    mediaInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFile(file);
        }
    };

    // Drag and drop
    dropZone.ondragover = (e) => {
        e.preventDefault();
        dropZone.classList.add("border-primary");
    };

    dropZone.ondragleave = () => {
        dropZone.classList.remove("border-primary");
    };

    dropZone.ondrop = (e) => {
        e.preventDefault();
        dropZone.classList.remove("border-primary");
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("image/")) {
            handleFile(file);
        }
    };

    function handleFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            storyPreview.src = e.target.result;
            previewContainer.classList.remove("d-none");
            dropZone.classList.add("d-none");
            publishBtn.classList.remove("d-none");
        };
        reader.readAsDataURL(file);
    }

    // Publish
    publishBtn.onclick = async () => {
        const file = mediaInput.files[0] || null;
        if (!file) return;

        publishBtn.classList.add("d-none");
        loader.classList.remove("d-none");

        const formData = new FormData();
        formData.append("storyMedia", file);

        try {
            const res = await fetch("/api/stories/create", {
                method: "POST",
                body: formData
            });
            const data = await res.json();
            
            if (data.flag === 1) {
                window.location.href = "/dashboard";
            } else {
                alert(data.msg || "Failed to post story");
                publishBtn.classList.remove("d-none");
                loader.classList.add("d-none");
            }
        } catch (error) {
            console.error("Upload Error:", error);
            alert("Something went wrong");
            publishBtn.classList.remove("d-none");
            loader.classList.add("d-none");
        }
    };
});
