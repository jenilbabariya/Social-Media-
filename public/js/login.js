
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  if (!form) return;
  const loginButton = document.getElementById("loginButton");
  const errorBox = document.getElementById("error");
  const successBox = document.getElementById("success");

  const fieldErrors = {
    login: document.getElementById("loginError"),
    password: document.getElementById("passwordError")
  };
  const clearMessages = () => {
    errorBox.innerText = "";
    successBox.innerText = "";

    Object.values(fieldErrors).forEach(el => {
      if (el) el.innerText = "";
    });

    document.querySelectorAll("#loginForm input").forEach(input => {
      input.classList.remove("is-invalid");
    });
  };

  document.querySelectorAll("#loginForm input").forEach(input => {
    input.addEventListener("input", () => {
      const errEl = document.getElementById(`${input.id}Error`);
      if (errEl) errEl.innerText = "";
    });
  });


  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessages();

    const bodyData = {
      login: document.getElementById("login").value.trim(),
      password: document.getElementById("password").value
    };

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify(bodyData)
      });

      const data = await res.json();

      if (data.flag === 0) {
        if (typeof data.data === "object") {
          const inputField = document.getElementById(field);
          Object.keys(data.data).forEach(field => {
            if (fieldErrors[field]) {
              fieldErrors[field].innerText = data.data[field][0];
              inputField.classList.add("is-invalid");
            }
          });
        } else {
          errorBox.innerText = data.msg || "Login failed";
        }
        return;
      }

      if (data.flag === 2) {
        errorBox.innerText = data.msg || "Invalid credentials";
        return;
      }

      if (data.flag === 1) {
        loginButton.disabled = true;
        successBox.innerText = data.msg || "Login successful";
        // showToast("Login successful!", "success");

        setTimeout(() => {
        window.location.href = "/dashboard";
        }, 1500);

      }

    } catch (err) {
      console.error(err);
      errorBox.innerText = "Something went wrong. Please try again.";
    }

  });
});