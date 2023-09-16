let apikey = "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"

const fetch = require('node-fetch');

class OpenAIApi {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.endpoint = 'https://api.openai.com/v1/engines/davinci-codex/completions';  // Adjust the engine if needed
        this.conversations = {};
    }

    async startConversation(identifier) {
        this.conversations[identifier] = [];
    }

    async query(identifier, message) {
        if (!this.conversations[identifier]) {
            throw new Error('Conversation not started. Use startConversation first.');
        }

        this.conversations[identifier].push({ role: 'user', content: message });

        const response = await fetch(this.endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: this.conversations[identifier]
            })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(`Failed to fetch from OpenAI API: ${data.error ? data.error.message : response.statusText}`);
        }

        const data = await response.json();
        const assistantMessage = data.choices[0].message.content;

        this.conversations[identifier].push({ role: 'assistant', content: assistantMessage });

        return assistantMessage;
    }
}

// Usage example:
(async () => {
    const apiKey = apikey;
    const api = new OpenAIApi(apiKey);

    const conversationID = 1;  // This should be a unique ID, you can generate one dynamically if needed
    api.startConversation(conversationID);

    try {
        let result = await api.query(conversationID, 'Hello');
        console.log('Assistant:', result);

        result = await api.query(conversationID, 'How are you?');
        console.log('Assistant:', result);
    } catch (error) {
        console.error('Error:', error);
    }
})();
