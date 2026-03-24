document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("registerForm");
    const error = document.getElementById("error");
    const success = document.getElementById("success");
    const registerBtn = document.getElementById("registerBtn");

    if (!form) return;

    error.innerText = "";

    document.querySelectorAll("#registerForm input").forEach(input => {
        input.addEventListener("input", () => {
            const errorEl = document.getElementById(`${input.id}Error`);
            if (errorEl) errorEl.innerText = "";
            error.innerText = "";
            input.classList.remove("is-invalid");
        });
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        registerBtn.disabled = true;
        registerBtn.innerText = "Registering...";
        error.innerText = "";
        success.innerText = "";

        const bodyData = {
            fullname: document.getElementById("fullname").value,
            username: document.getElementById("username").value,
            email: document.getElementById("email").value,
            password: document.getElementById("password").value,
            confirmPassword: document.getElementById("confirmPassword").value,
        };

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                body: JSON.stringify(bodyData),
            });

            const data = await res.json();

            if (
                data.flag === 0 &&
                data.data &&
                typeof data.data === "object" &&
                Object.keys(data.data).length
            ) {
                Object.keys(data.data).forEach(field => {
                    const fieldError = document.getElementById(`${field}Error`);
                    const inputField = document.getElementById(field);
                    if (fieldError) {
                        fieldError.innerText = data.data[field][0];
                        inputField.classList.add("is-invalid");
                    }
                });
                return;
            }

            if (data.flag !== 1) {
                error.innerText = data.msg || "Registration failed";
                registerBtn.disabled = false;
                registerBtn.innerText = "Register";
                return;
            }
            success.innerText = data.msg || "Registration successful! Redirecting...";
            window.location.href = `/verify-email/${data.data}`;

        } catch (err) {

            error.innerText = "Something went wrong. Please try again.";
            registerBtn.disabled = false;
            registerBtn.innerText = "Register";
        }
    });
});