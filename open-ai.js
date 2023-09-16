// Filename: openai-api.js
let apikey = "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"
console.log(apikey)
const fetch = require('node-fetch');  // You'll need to install this if you're using Node.js

class OpenAIApi {
    constructor(apiKey) {
        this.apiKey = apikey;
        this.endpoint = 'https://api.openai.com/v1/engines/davinci/completions';  // You can change the engine as per your needs
    }       

    async query(prompt) {
        const response = await fetch(this.endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: prompt,
                max_tokens: 150  // You can adjust the parameters as per your requirements
            })
        });

        if (!response.ok) {
            throw new Error('Failed to fetch from OpenAI API');
        }

        const data = await response.json();
        return data.choices[0].text.trim();  // Extracting the completion text
    }
}

// Usage example:
(async () => {
    const apiKey = apikey;
    const api = new OpenAIApi(apiKey);
    try {
        const result = await api.query('Translate the following English text to French: "Hello, how are you?"');
        console.log(result);
    } catch (error) {
        console.error('Error:', error);
    }
})();
