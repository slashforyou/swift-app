/**
 * Server Connection Test - Refactorisé selon meilleures pratiques UI mobiles
 * Test des endpoints GET, POST, PUT, DELETE avec interface moderne
 */

import React, { useState } from 'react';
import { 
  Screen, 
  VStack, 
  Card, 
  Button, 
  Title, 
  Body, 
  Muted 
} from '../../src/components';
import { ServerData } from '@/src/constants/ServerData';
import { useTheme } from '../../src/context/ThemeProvider';

const ServerConnectionTest = () => {
    const { colors } = useTheme();
    const [response, setResponse] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [serverResponses, setServerResponses] = useState<string[]>([]);

    const runServerTests = () => {
        setResponse(null);
        setError(null);
        setLoading(true);
        setServerResponses([]);
        
        const methods: ('GET' | 'POST' | 'PUT' | 'DELETE')[] = ['GET', 'POST', 'PUT', 'DELETE'];
        methods.forEach(async (method) => {
            const result = await testServer(method);
            setServerResponses(prevResponses => [...prevResponses, result]);
        });
    };

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
        <Screen>
            <VStack gap="lg">
                <Card>
                    <VStack gap="lg">
                        <Title>Server Connection Test</Title>
                        <Muted>Test des endpoints REST API (GET, POST, PUT, DELETE)</Muted>
                        
                        <Button 
                            title="🔄 Test Server Connection" 
                            variant="primary" 
                            onPress={runServerTests}
                            disabled={loading}
                        />
                    </VStack>
                </Card>
                
                {/* Status Display */}
                <Card>
                    <VStack gap="md">
                        {loading && !response && (
                            <Body style={{ color: colors.textSecondary }}>⏳ Loading...</Body>
                        )}
                        
                        {!loading && !response && !error && (
                            <Muted>No response yet. Click the button to test server connection.</Muted>
                        )}
                        
                        {response && (
                            <VStack gap="sm">
                                <Muted>Server Response:</Muted>
                                <Body style={{ color: colors.success }}>{response}</Body>
                            </VStack>
                        )}
                        
                        {error && (
                            <VStack gap="sm">
                                <Muted>Error:</Muted>
                                <Body style={{ color: colors.error }}>{error}</Body>
                            </VStack>
                        )}
                    </VStack>
                </Card>
            </VStack>
        </Screen>
    );
}

export default ServerConnectionTest;

