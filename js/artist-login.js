document.addEventListener("DOMContentLoaded", () => { // wait page load
  const form = document.getElementById("artistLoginForm"); // form
  const username = document.getElementById("artistUsername"); // username input
  const password = document.getElementById("artistPassword"); // password input
  const togglePw = document.getElementById("togglePw"); // show/hide btn
  const loginBtn = document.getElementById("loginBtn"); // login button

  const userErr = document.getElementById("userErr"); // username error
  const passErr = document.getElementById("passErr"); // password error
  const hint = document.getElementById("hint"); // hint text
  const loginGeneralError = document.getElementById("loginGeneralError"); // general error

  const API_BASE = "http://127.0.0.1:5000/api"; // backend url

  function setLoginLoading(isLoading) { // loading state
    if (!loginBtn) return;

    if (isLoading) {
      loginBtn.dataset.originalText = loginBtn.textContent;
      loginBtn.textContent = "Logging in..."; // change text
      loginBtn.disabled = true;
      loginBtn.classList.add("is-loading");
    } else {
      loginBtn.textContent = loginBtn.dataset.originalText || "Login"; // restore text
      loginBtn.disabled = false;
      loginBtn.classList.remove("is-loading");
    }
  }

  togglePw?.addEventListener("click", () => { // toggle password
    const isHidden = password.type === "password";
    password.type = isHidden ? "text" : "password";
    togglePw.textContent = isHidden ? "Hide" : "Show";
  });

  form?.addEventListener("submit", async (e) => {
    e.preventDefault(); // stop refresh

    userErr.textContent = ""; // clear errors
    passErr.textContent = "";
    loginGeneralError.textContent = "";
    hint.textContent = "";

    const usernameValue = username.value.trim(); // get username
    const passwordValue = password.value.trim(); // get password

    let ok = true; // validation flag

    if (!usernameValue) {
      userErr.textContent = "Please enter your username."; // empty username
      ok = false;
    }

    if (!passwordValue) {
      passErr.textContent = "Please enter your password."; // empty password
      ok = false;
    } else if (passwordValue.length < 6) {
      passErr.textContent = "Password must be at least 6 characters."; // short password
      ok = false;
    }

    if (!ok) return; // stop if invalid

    setLoginLoading(true);

    try {
      const res = await fetch(`${API_BASE}/artist-login`, { // send login request
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: usernameValue,
          password: passwordValue
        })
      });

      const result = await res.json(); // get response

      if (!res.ok || !result.success) {
        loginGeneralError.textContent = result.message || "Invalid username or password."; // show error
        setLoginLoading(false);
        return;
      }

      sessionStorage.setItem("zeena_artist_logged_in", "true"); // save login state
      sessionStorage.setItem("zeena_artist_username", result.artist?.username || usernameValue); // save username

      hint.textContent = "Login successful..."; // success message

      setTimeout(() => {
        window.location.href = "./artist-dashboard.html"; // go dashboard
      }, 500);

    } catch (err) {
      console.error("Artist login failed:", err);
      loginGeneralError.textContent = "Could not connect to the server. Please try again."; // server error
      setLoginLoading(false);
    }
  });
});