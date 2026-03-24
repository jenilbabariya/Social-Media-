function showAlert(message, type = "primary") {
    const modalEl = document.getElementById("globalAlertModal");
    const title = document.getElementById("globalAlertTitle");
    const body = document.getElementById("globalAlertBody");

    title.textContent = type === "danger" ? "Error" : "Success";
    body.textContent = message;

    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}
function showConfirm(message) {
    return new Promise((resolve) => {
        const modalEl = document.getElementById("globalConfirmModal");
        const body = document.getElementById("globalConfirmBody");
        const confirmBtn = document.getElementById("confirmBtn");

        body.textContent = message;

        const modal = new bootstrap.Modal(modalEl);
        modal.show();

        confirmBtn.onclick = () => {
            confirmBtn.blur();
            modal.hide();
            resolve(true);
        };

        modalEl.addEventListener("hidden.bs.modal", () => {
            resolve(false);
        }, { once: true });
    });
}
function showToast(message, type = "success") {

    const toastEl = document.getElementById("globalToast");
    const toastBody = document.getElementById("globalToastBody");

    if (!toastEl || !toastBody) {
        console.error("Toast elements missing");
        return;
    }

    toastEl.classList.remove("bg-success", "bg-danger", "bg-warning", "bg-primary");

    toastEl.classList.add(
        type === "danger" ? "bg-danger" :
        type === "warning" ? "bg-warning" :
        type === "primary" ? "bg-primary" :
        "bg-success"
    );

    toastBody.textContent = message;

    const toast = new bootstrap.Toast(toastEl, {
        delay: 1500,   
        autohide: true
    });

    toast.show();
}

// Logout
document.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.getElementById("logoutBtn");

    if (!logoutBtn) {
        return;
    }

    logoutBtn.addEventListener("click", async () => {
        const confirmLogout = await showConfirm("Are you sure you want to logout?");

        if (!confirmLogout) return;
        try {
            const res = await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "include"
            });
            const data = await res.json();

            if (data.flag === 1) {
                showToast("Logged out successfully!", "success");
                    setTimeout(() => {              
                window.location.href = "/login-page";
                }, 1500);
            } else {
                showAlert("Logout failed", "danger");
            }
        }
        catch (err) {
            showAlert("Logout failed. Please try again.", "danger");
        }
    });
});
