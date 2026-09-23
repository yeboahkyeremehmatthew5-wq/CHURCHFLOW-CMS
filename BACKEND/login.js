// ======================================================
// CHURCHFLOW LOGIN JAVASCRIPT
// ======================================================

const API_URL = "http://127.0.0.1:8000";


// ======================================================
// LOGIN PAGE
// ======================================================

document.addEventListener("DOMContentLoaded", function () {

    // ==================================================
    // PASSWORD SHOW / HIDE
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


            // ==========================================
            // GET FORM VALUES
            // ==========================================

            const username =
                document
                    .getElementById("username")
                    .value
                    .trim();


            const password =
                document
                    .getElementById("password")
                    .value;


            const rememberMe =
                document
                    .getElementById("rememberMe")
                    .checked;


            const message =
                document
                    .getElementById("loginMessage");


            // ==========================================
            // CLEAR OLD MESSAGE
            // ==========================================

            message.textContent =
                "Logging in...";

            message.className =
                "login-message";


            try {

                // ======================================
                // SEND LOGIN REQUEST TO FASTAPI
                // ======================================

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


                // ======================================
                // READ SERVER RESPONSE
                // ======================================

                const data =
                    await response.json();


                // ======================================
                // CHECK FOR LOGIN ERROR
                // ======================================

                if (!response.ok) {

                    throw new Error(
                        data.detail ||
                        "Invalid username or password"
                    );

                }


                // ======================================
                // SAVE LOGGED-IN USER
                // ======================================

                const loggedInUser = {

                    username:
                        data.username,

                    role:
                        data.role

                };


                // ======================================
                // REMOVE OLD LOGIN DATA
                // ======================================

                localStorage.removeItem(
                    "churchflowUser"
                );

                sessionStorage.removeItem(
                    "churchflowUser"
                );


                // ======================================
                // REMEMBER ME
                // ======================================

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


                // ======================================
                // SUCCESS MESSAGE
                // ======================================

                message.textContent =
                    "Login successful. Opening ChurchFlow...";

                message.className =
                    "login-message success";


                // ======================================
                // REDIRECT TO FRONTEND
                // ======================================
                //
                // IMPORTANT:
                // The frontend is being served by
                // Live Server on port 5501.
                //
                // FastAPI is only the backend.
                //
                // Therefore we explicitly open:
                //
                // http://127.0.0.1:5501/index.html
                //
                // instead of:
                //
                // http://127.0.0.1:8000/Backend/index.html
                //
                // ======================================

                setTimeout(function () {

                    window.location.href =
                        "http://127.0.0.1:5501/index.html";

                }, 500);


            } catch (error) {

                // ======================================
                // LOGIN ERROR
                // ======================================

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