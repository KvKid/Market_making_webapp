window.addEventListener('DOMContentLoaded', (event) => {
    // Populate day dropdown
    const dayDropdown = document.getElementById('day');
    for (let i = 1; i <= 31; i++) {
        let option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        dayDropdown.appendChild(option);
    }

    // Populate month dropdown
    const monthDropdown = document.getElementById('month');
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    months.forEach((month, index) => {
        let option = document.createElement('option');
        option.value = index + 1; // Since index starts from 0
        option.textContent = month;
        monthDropdown.appendChild(option);
    });

    // Populate year dropdown dynamically based on the current year
    const yearDropdown = document.getElementById('year');
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= 1900; i--) {
        let option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        yearDropdown.appendChild(option);
    }

    const firstNameInput = document.getElementById('firstName');
    const firstNameError = document.getElementById('firstNameError');

    firstNameInput.addEventListener('blur', function() {
        // This regex checks for only letters and possibly hyphens and spaces.
        if (!/^[a-zA-Z\s\-]+$/i.test(firstNameInput.value)) {
            firstNameError.textContent = 'First name can only contain letters, spaces, and hyphens.';
        } else {
            firstNameError.textContent = ''; // Clear the error if input is valid
        }
    });

    const lastNameInput = document.getElementById('lastName');
    const lastNameError = document.getElementById('lastNameError');

    lastNameInput.addEventListener('blur', function() {
        // This regex checks for only letters and possibly hyphens and spaces.
        if (!/^[a-zA-Z\s\-]+$/i.test(lastNameInput.value)) {
            lastNameError.textContent = 'Last name can only contain letters, spaces, and hyphens.';
        } else {
            lastNameError.textContent = ''; // Clear the error if input is valid
        }
    });



    document.getElementById("confirmPassword").addEventListener("blur", function() {
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;
        const passwordMismatchError = document.getElementById("passwordMismatchError");
    
        if (password !== confirmPassword) {
            passwordMismatchError.textContent = "Passwords do not match!";
        } else {
            passwordMismatchError.textContent = ""; // Clear the error message
        }
    });

});

document.getElementById("signupForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    const errorDiv = document.getElementById("errorMessages");
    errorDiv.textContent = ''; // Clear previous errors

    let firstName = document.getElementById("firstName").value;
    let lastName= document.getElementById("lastName").value;
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;
    let confirmpassword = document.getElementById("confirmPassword").value;

    // Gather the day, month, year values here
    const day = document.getElementById('day').value;
    const month = document.getElementById('month').value;
    const year = document.getElementById('year').value;
    const dateOfBirth = `${year}-${month}-${day}`; // format it in a way suitable for your backend
    let country = document.getElementById("country").value;
    console.log({ firstName,lastName,email, password, confirmpassword,dob: dateOfBirth, country })
    let response = await fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ firstName, lastName, email, password, confirmpassword, dob: dateOfBirth, country })
    });

    let result = await response.json();

    if (result.status === 'success') {
        window.location.href = '/dashboard.html'; // Redirect to login on successful registration
    } else {
        errorDiv.textContent = result.message; // Display the error message
    }

    
});