function generateNumbers() {
    const num1 = Math.floor(Math.random() * 100);
    const num2 = Math.floor(Math.random() * 100);

    document.getElementById('num1').textContent = num1;
    document.getElementById('num2').textContent = num2;
}

function checkAnswer() {
    const num1 = parseInt(document.getElementById('num1').textContent);
    const num2 = parseInt(document.getElementById('num2').textContent);
    const userInput = parseInt(document.getElementById('userInput').value);

    if ((num1 + num2) === userInput) {
        document.getElementById('result').textContent = "Correct!";
        document.getElementById('result').style.color = "green";
    } else {
        document.getElementById('result').textContent = "Wrong!";
        document.getElementById('result').style.color = "red";
    }
}

function askGPTAboutTime() {
    fetch('http://localhost:3000/ask-time')
        .then(response => response.json())
        .then(data => {
            document.getElementById('gptResponse').textContent = data.response;
        })
        .catch(error => {
            console.error("Error:", error);
            document.getElementById('gptResponse').textContent = "Error getting response.";
        });
}


document.addEventListener('DOMContentLoaded', function() {
    // Check if the user is logged in
    fetch('/isLoggedIn')
    .then(response => response.json())
    .then(data => {
        const accountButton = document.getElementById('accountButton');
        
        if (data.loggedIn) {
            accountButton.innerHTML = 'Account';
            // Add dropdown for Account
            const dropdown = document.createElement('div');
            dropdown.innerHTML = `
                <div>
                    <a href="#">Profile</a>
                </div>
                <div>
                    <a href="#">Logout</a>
                </div>
            `;
            dropdown.style.display = 'none';
            accountButton.insertAdjacentElement('afterend', dropdown);

            accountButton.addEventListener('click', function() {
                dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
            });
        } else {
            accountButton.innerHTML = 'Login';
            // Add event listener for login or redirect to login page
            accountButton.addEventListener('click', function() {
                window.location.href = "/login";
            });
        }
    })
    .catch(error => console.error('Error:', error));
});