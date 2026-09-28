// ======================================================
// CHURCHFLOW CMS - LOGIN JAVASCRIPT
// ======================================================

const API_URL = "http://127.0.0.1:8000";

document.addEventListener("DOMContentLoaded", function () {

    // ==================================================
    // SHOW / HIDE PASSWORD
    // ==================================================

    const togglePassword =
        document.getElementById("togglePassword");

    const passwordInput =
        document.getElementById("password");

    if (togglePassword && passwordInput) {

        togglePassword.addEventListener(
            "click",
            function () {

                if (passwordInput.type === "password") {

                    passwordInput.type = "text";

                    togglePassword.textContent = "Hide";

                } else {

                    passwordInput.type = "password";

                    togglePassword.textContent = "Show";
                }
            }
        );
    }


    // ==================================================
    // LOGIN FORM
    // ==================================================

    const loginForm =
        document.getElementById("loginForm");

    if (!loginForm) {
        return;
    }


    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            // Get username
            const username =
                document
                    .getElementById("username")
                    .value
                    .trim();


            // Get password
            const password =
                document
                    .getElementById("password")
                    .value;


            // Get remember me
            const rememberMe =
                document
                    .getElementById("rememberMe")
                    .checked;


            // Message area
            const message =
                document.getElementById("loginMessage");


            // Check empty fields
            if (!username || !password) {

                message.textContent =
                    "Please enter your username and password.";

                message.className =
                    "login-message error";

                return;
            }


            message.textContent =
                "Logging in...";

            message.className =
                "login-message";


            try {

                // ==================================================
                // SEND LOGIN REQUEST TO FASTAPI
                // ==================================================

                const response =
                    await fetch(
                        `${API_URL}/login`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                username: username,
                                password: password
                            })
                        }
                    );


                // Read response
                const data =
                    await response.json();


                // ==================================================
                // LOGIN FAILED
                // ==================================================

                if (!response.ok) {

                    throw new Error(
                        data.detail ||
                        "Invalid username or password."
                    );
                }


                // ==================================================
                // SAVE LOGGED-IN USER
                // ==================================================

                const loggedInUser = {

                    username:
                        data.username || username,

                    role:
                        data.role || "member"

                };


                // Clear old login information
                localStorage.removeItem(
                    "churchflowUser"
                );

                sessionStorage.removeItem(
                    "churchflowUser"
                );


                // Remember login
                if (rememberMe) {

                    localStorage.setItem(
                        "churchflowUser",
                        JSON.stringify(loggedInUser)
                    );

                } else {

                    sessionStorage.setItem(
                        "churchflowUser",
                        JSON.stringify(loggedInUser)
                    );
                }


                // ==================================================
                // SUCCESS MESSAGE
                // ==================================================

                message.textContent =
                    "Login successful. Opening ChurchFlow...";

                message.className =
                    "login-message success";


                // ==================================================
                // OPEN DASHBOARD
                // ==================================================

                setTimeout(function () {

                    window.location.href =
                        "http://127.0.0.1:5501/index.html";

                }, 500);


            } catch (error) {

                console.error(
                    "Login error:",
                    error
                );


                message.textContent =
                    error.message ||
                    "Unable to connect to ChurchFlow server.";

                message.className =
                    "login-message error";
            }

        }
    );

});