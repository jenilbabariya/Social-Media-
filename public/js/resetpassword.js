document.addEventListener("DOMContentLoaded", function () {

    const form = document.querySelector("#resetPasswordForm");
    const messageBox = document.getElementById("messageBox");
     const button = form.querySelector("button");

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;
        button.disabled = true;

        try {
            const res = await fetch(`/api/auth/reset-password/${window.location.pathname.split("/").pop()}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ password, confirmPassword }),
            });

            const data = await res.json();

     if (data.flag === 0) {

    let errorMessage = data.msg;

    if (data.data && typeof data.data === "object") {
        const Key = Object.keys(data.data)[0];
        errorMessage = data.data[Key][0]; 
    }

    messageBox.innerText = errorMessage;
    messageBox.style.color = "red";
    button.disabled = false;
    return;
}

            messageBox.innerText = data.msg;
            messageBox.style.color = "green";
            button.textContent = "Successfull";
            button.disabled = true;
            // showToast("Password reset successful! Redirecting to login...", "success");
            setTimeout(() => {
                window.location.href = "/login-page";
            }, 2000);

        } catch (err) {
            messageBox.innerText = "Something went wrong.";
            messageBox.style.color = "red";
        }
    });

});