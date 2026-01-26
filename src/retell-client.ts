
import { RetellWebClient } from 'retell-client-js-sdk';

const agentId = "agent_fa3eb10feb7403f424b167f82a";

const retellWebClient = new RetellWebClient();

export async function startCall() {
    try {
        // In a real app, you would fetch this from your backend
        // which calls Retell API: POST https://api.retellai.com/v2/create-web-call
        // Authorization: Bearer YOUR_API_KEY
        // Body: { "agent_id": "..." }
        // AND returns the { "access_token": "..." }

        // FOR DEMO/TESTING ONLY without backend:
        // We cannot create a call directly from frontend as it requires the API Key
        // which is secret. 

        // However, if the user really wants to avoid buying a number, 
        // they MUST set up a backend endpoint or use a temporary token generation.

        console.log("Starting web call...");

        // Since we don't have a backend here, we will alert the user
        alert("To use Web Call (Browser Audio), you need a backend to generate an access token. Since this is a static demo, we cannot hide your API key safely. Please switch back to Phone Call mode by buying a number, OR set up a backend.");

        // If they had a token:
        // await retellWebClient.startCall({
        //   accessToken: "YOUR_ACCESS_TOKEN_FROM_BACKEND"
        // });

    } catch (err) {
        console.error("Error starting call:", err);
    }
}

export function stopCall() {
    retellWebClient.stopCall();
}
