document.addEventListener("DOMContentLoaded", function () {
    console.log("Settings JS loaded");
    const privacyToggle = document.getElementById("privacyToggle");
    const deleteAccountBtn = document.getElementById("deleteAccount");
    const changePasswordBtn = document.getElementById("changePassword");

    if (changePasswordBtn) {
        changePasswordBtn.addEventListener("click", function () {
            window.location.href = "/settings/change-password";
        });
    }

    if (privacyToggle) {
        privacyToggle.addEventListener("change", async function () {
            try {
                console.log("Toggling privacy to:", privacyToggle.checked);
                const res = await fetch("/settings/toggle-privacy", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ isPrivate: privacyToggle.checked })
                });
                const data = await res.json();
                console.log("Privacy toggle response:", data);
                if (data.flag === 1) {
                    showToast(data.msg || "Privacy setting updated successfully!", "success");
                    // showAlert("Privacy setting updated successfully!", "success");
                } else {
                    showAlert("Failed to update privacy setting.", "danger");
                }
            } catch (error) {
                showAlert("An error occurred while updating privacy setting.", "danger");
            }
        });
    }
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener("click", async function () {
            const confirmed = await showConfirm("Are you sure you want to delete your account? This action cannot be undone."); 
            if (confirmed) {
                try {
                    const res = await fetch("/settings/delete-account", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        }
                    });
                    const data = await res.json();
                    console.log("Delete account response:", data);
                    if (data.flag === 1) {
                        showToast("Account deleted successfully!", "success");
                        setTimeout(() => {
                        window.location.href = "/register-page";
                        }, 1000);
                    } else {
                        showAlert("Failed to delete account.", "danger");
                    }
                } catch (error) {
                    showAlert("An error occurred while deleting your account.", "danger");
                }
            }
        });
    }
});