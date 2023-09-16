const stripe = Stripe('pk_test_51Nj19aIY3pJef2XNcqHAnHUaBE4fVnmUmXNskeAwyhPQGBwrqHHKZtfuBvkdvVvabQheTKAuiTZ6rqCm8ZUUixSA00xFriJAE9'); // Make sure to use your public key
const elements = stripe.elements();

const card = elements.create('card');
card.mount('#card-element');

card.addEventListener('change', function(event) {
    const displayError = document.getElementById('card-errors');
    if (event.error) {
        displayError.textContent = event.error.message;
    } else {
        displayError.textContent = '';
    }
});

// Variables to handle the plan selection and price
const planCheckboxes = document.querySelectorAll('.plan-select');
const selectedPriceLabel = document.getElementById('selected-price');
const checkoutButton = document.getElementById('checkout-button');
let selectedPlanPrice = 0;  // default to $0

// Listen to checkbox changes to update the selected price and enable/disable the checkout button
planCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function() {
        if(this.checked) {
            selectedPlanPrice = this.getAttribute('data-price');
            selectedPriceLabel.textContent = `$${selectedPlanPrice / 100}`;  // converting cents to dollars

            // Uncheck other checkboxes
            planCheckboxes.forEach(box => {
                if(box !== this) {
                    box.checked = false;
                }
            });

            // Enable the checkout button
            checkoutButton.disabled = false;
        } else {
            selectedPriceLabel.textContent = '$0';
            checkoutButton.disabled = true;
        }
    });
});

const form = document.getElementById('payment-form');
form.addEventListener('submit', async function(event) {
    event.preventDefault();

    const {token, error} = await stripe.createToken(card);

    if (error) {
        const errorElement = document.getElementById('card-errors');
        errorElement.textContent = error.message;
    } else {
        stripeTokenHandler(token);
    }
});

function stripeTokenHandler(token) {
    // Fetch the description based on the selected plan price
    let description;
    switch(selectedPlanPrice) {
        case "100":
            description = "Basic Plan";
            break;
        case "200":
            description = "Pro Plan";
            break;
        case "500":
            description = "Expert Plan";
            break;
    }

    // Send the token to your server
    const payload = {
    token: token.id,
    amount: selectedPlanPrice, 
    currency: 'usd',
    description: description
    };
    console.log("Sending payload:", payload);

    fetch('/charge', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            token: token.id,
            amount: selectedPlanPrice, 
            currency: 'usd',
            description: description
        })
    }).then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Payment successful!');
            // Handle redirection or UI update here
        } else {
            console.log('Payment failed. Please try again.');
            console.log(data.message)
        }
    }).catch(error => {
        console.error("Error:", error);
    });
}
