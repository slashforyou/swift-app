import { API_URL } from '../config/environment';

export const ServerData = {
    /**
     * The server URL is used to connect to the server.
     * It is used in the API calls to the server.
     * It is also used in the WebSocket connection.
     * 
     * ✅ Now uses centralized environment configuration
     */
    serverUrl: API_URL,
    
    /**
     * The API key is used to authenticate the user with the server.
     * ⚠️ NOTE: This is a placeholder. In production, API keys should be:
     * - Stored in environment variables (.env)
     * - Never committed to version control
     * - Managed via secure secrets management
     */
    apiKey: 'your-api-key-here',
};