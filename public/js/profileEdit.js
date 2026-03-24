document.addEventListener("DOMContentLoaded", function () {
    console.log("Profile Edit JS loaded");
    const coverInput = document.getElementById("coverInput");

    const profileInput = document.getElementById("profileInput");
    const coverPreview = document.getElementById("coverPreview");
    const profilePreview = document.getElementById("profilePreview");

    if (coverInput && coverPreview) {
        coverInput.addEventListener("change", function () {
            const file = this.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function (e) {
                coverPreview.style.backgroundImage = `url('${e.target.result}')`;
            };
            reader.readAsDataURL(file);
        });
    }

    if (profileInput && profilePreview) {
        profileInput.addEventListener("change", function () {
            const file = this.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function (e) {
                profilePreview.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }
    const fullnameInput = document.getElementById("fullname");
    const usernameInput = document.getElementById("username");
    const errorFullname = document.getElementById("error-fullname");
    const errorUsername = document.getElementById("error-username");

    function showError(element, message) {
        if (element) {
            element.textContent = message;
            element.style.display = "block";
        }
    }

    function hideError(element) {
        if (element) {
            element.textContent = "";
            element.style.display = "none";
        }
    }

    if (fullnameInput) {
        fullnameInput.addEventListener("input", () => hideError(errorFullname));
    }

    if (usernameInput) {
        usernameInput.addEventListener("input", function() {
            hideError(errorUsername);
            // Auto-lowercase if they type, though we'll validate it on submit too
            // this.value = this.value.toLowerCase(); 
        });
    }

    const form = document.getElementById("editProfileForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        // Frontend Validation
        let hasError = false;
        
        if (!fullnameInput.value.trim()) {
            showError(errorFullname, "Full name is required");
            hasError = true;
        }

        const usernameValue = usernameInput.value.trim();
        if (!usernameValue) {
            showError(errorUsername, "Username is required");
            hasError = true;
        } else if (usernameValue !== usernameValue.toLowerCase()) {
            showError(errorUsername, "Username must be in lowercase");
            hasError = true;
        }

        if (hasError) return;

        const saveBtn = document.getElementById("saveBtn");
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = "Saving...";
        }

        const formData = new FormData(form);
        try {
            const res = await fetch("/profile/update-profile", {
                method: "POST",
                body: formData
            });

            const data = await res.json();
            if (data.flag === 1) {
                showToast(data.msg || "Profile updated successfully!", "success");
                setTimeout(() => {
                    window.location.href = `/profile/${data.data.username}`;
                }, 1000);
            }
            else {
                showAlert(data.message || "Profile update failed", "danger");
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.textContent = "Save Changes";
                }
            }
        }
        catch (error) {
            showAlert("An error occurred while updating profile", "danger");
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = "Save Changes";
            }
        }
    });

});