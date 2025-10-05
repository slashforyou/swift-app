// This file is used to test the server connection [GET, POST, PUT, DELETE] and return the response.
// It is a React component that can be used in the app to test the server connection.
// It use the `axios` library to make HTTP requests to the server.
import React, { useState } from 'react';
import { ServerData } from '@/src/constants/ServerData';
import { Pressable, Text } from 'react-native';

const ServerConnectionTest = () => {
    const [response, setResponse] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [serverResponses, setServerResponses] = useState<string[]>([]);

    const serverTestsWhile =  () => {
        setResponse(null);
        setError(null);
        setLoading(true);
        // Define the methods to test the server connection
        setServerResponses([]);
        const methods: ('GET' | 'POST' | 'PUT' | 'DELETE')[] = ['GET', 'POST', 'PUT', 'DELETE'];
        methods.forEach(async (method) => {
            const result = await testServer(method);
            setServerResponses(prevResponses => [...prevResponses, result]);
        });
    }
    // Call the server tests when the component mounts

    React.useEffect(() => {
        if(serverResponses.length > 0) {
            console.log('Server responses ' + serverResponses.length + '/4 received');
            setResponse('Server responses ' + serverResponses.length + '/4 received');
            setLoading(false);
            if (serverResponses.length === 4) {
                console.log('All server responses received : \n' + serverResponses.join('\n'));
                setResponse('All server responses received :\n' + serverResponses.join('\n'));
            }
        }
    }, [serverResponses]);


    const testServer = async (type: 'GET' | 'POST' | 'PUT' | 'DELETE') => {
        try {
            console.log(`Testing server with ${ServerData.serverUrl}${type.toLowerCase()}-test`);

            const response = await fetch(`${ServerData.serverUrl}${type.toLowerCase()}-test`, {
                method: type,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${ServerData.apiKey}`,
                },
            });
            if (!response.ok) {
                return `Error during ${type} request: ${response.statusText}`;
            }
            const data = await response.json();
            return `Response from ${type} request: ${JSON.stringify(data)}`;
        } catch (err) {
            return `Error during ${type} request: ${err instanceof Error ? err.message : 'An unknown error occurred'}`;
        }
    };

    return (
        <>
        <Pressable onPress={serverTestsWhile} style={{ padding: 10, backgroundColor: '#007BFF', borderRadius: 5, marginTop: 20 }}>
            <Text style={{ color: '#FFFFFF' }}>Test Server Connection</Text>
        </Pressable>
            {loading && !response && <Text style={{ color: 'gray', marginTop: 10 }}>Loading...</Text>}
            {!loading && !response && !error && <Text style={{ color: 'gray', marginTop: 10 }}>No response yet</Text>}
            {response && <Text style={{ color: 'green', marginTop: 10 }}>Response: {response}</Text>}
            {error && <Text style={{ color: 'red', marginTop: 10 }}>Error: {error}</Text>}
        </>

    );
}

export default ServerConnectionTest;

