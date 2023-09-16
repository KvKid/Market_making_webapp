document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const loginStatus = document.getElementById('loginStatus');
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    fetch("http://localhost:3000/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: email, password: password })
    })
    .then(response => response.json()) // Parsing the JSON response from the server
    .then(data => {
        if (data.message === 'Login successful.') {
            // Do whatever you want after a successful login, like redirecting to a dashboard
            window.location.replace("/dashboard");
        } else {
            // Display the error message from the server in the loginStatus element
            loginStatus.textContent = data.message;
        }
    })
    .catch(error => {
        console.error('There was an error during the login process:', error);
        loginStatus.textContent = "Error occurred during login.";
    });
});
