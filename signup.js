const API_URL = "http://127.0.0.1:8000";

document.addEventListener("DOMContentLoaded", function () {

const signupForm = document.getElementById("signupForm");

if (!signupForm) {
    return;
}

signupForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const username =
        document.getElementById("signupUsername").value.trim();

    const email =
        document.getElementById("signupEmail").value.trim();

    const password =
        document.getElementById("signupPassword").value;

    const confirmPassword =
        document.getElementById("confirmPassword").value;

    const message =
        document.getElementById("signupMessage");


    // Check passwords
    if (password !== confirmPassword) {

        message.textContent =
            "Passwords do not match.";

        message.className =
            "login-message error";

        return;
    }


    // Check password length
    if (password.length < 6) {

        message.textContent =
            "Password must be at least 6 characters.";

        message.className =
            "login-message error";

        return;
    }


    message.textContent =
        "Creating your account...";

    message.className =
        "login-message";


    try {

        const response = await fetch(
            `${API_URL}/users`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    username: username,
                    email: email,
                    password: password,
                    role: "member"
                })
            }
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Unable to create account."
            );

        }


        message.textContent =
            "Account created successfully! Redirecting to login...";

        message.className =
            "login-message success";


        setTimeout(function () {

            window.location.href =
                "http://127.0.0.1:5501/login.html";

        }, 1500);


    } catch (error) {

        console.error(
            "Sign up error:",
            error
        );

        message.textContent =
            error.message ||
            "Unable to connect to ChurchFlow server.";

        message.className =
            "login-message error";

    }

});

});