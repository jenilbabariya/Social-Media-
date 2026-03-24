document.addEventListener("DOMContentLoaded", function () {
    console.log("Change Password JS loaded");
    const changePasswordForm = document.getElementById("changePasswordForm");
    const messageBox = document.getElementById("MessageBox");
    const passwordInputs = changePasswordForm?.querySelectorAll("input[type='password']");
    const Btn = document.getElementById("Btn");

    // Clear message box on input
    if (passwordInputs) {
        passwordInputs.forEach(input => {
            input.addEventListener("input", function () {
                messageBox.style.display = "none";
                messageBox.textContent = "";
            });
        });
    }

    if (changePasswordForm) {
        changePasswordForm.addEventListener("submit", async function (e) {
            e.preventDefault();
            Btn.disabled = true;

            const currentPassword = changePasswordForm.currentPassword.value;
            const newPassword = changePasswordForm.newPassword.value;
            const confirmPassword = changePasswordForm.confirmPassword.value;

            try {
                const res = await fetch("/settings/change-password", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
                });
                const data = await res.json();

                messageBox.style.display = "block";

                if (data.flag === 0) {
                    if (data.data && typeof data.data === "object" && Object.keys(data.data).length > 0) {
                        const firstKey = Object.keys(data.data)[0];
                        messageBox.textContent = data.data[firstKey][0];
                    } else {
                        messageBox.textContent = data.msg || "Something went wrong.";
                    }

                    messageBox.style.color = "red";
                    Btn.disabled = false;

                } else {
                    messageBox.textContent = data.msg || "Success!";
                    messageBox.style.color = "green";

                    Btn.textContent = "Password Updated";
                    Btn.disabled = true;
                    showToast("Password updated successfully! Redirecting...", "success");

                    setTimeout(() => {
                        window.location.href = "/settings";
                    }, 2000);
                }


            } catch (error) {
                console.error(err);
                messageBox.style.display = "block";
                messageBox.textContent = "Server error.";
                messageBox.style.color = "red";
                Btn.disabled = false;
            }
        });
    }
});
