document.addEventListener("DOMContentLoaded", function () {

    const form = document.getElementById("forgotForm");
    const emailInput = document.getElementById("email");
    const errorEl = document.getElementById("error");
    const successEl = document.getElementById("success");

    const button = form.querySelector("button");

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        errorEl.textContent = "";

        button.disabled = true;
        button.textContent = "Sending...";

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email: emailInput.value })
            });

            const data = await res.json();

            if (data.flag === 0) {
                errorEl.textContent = data.msg;
                button.disabled = false;
                button.textContent = "Send Reset Link";
                return;
            }
            successEl.textContent = data.msg;
            setTimeout(() => {
            window.location.href = "/login-page";

            }, 3000);

        } catch (err) {
            errorEl.textContent = "Server error. Please try again.";
            button.disabled = false;
            button.textContent = "Send Reset Link";
        }

    });

});