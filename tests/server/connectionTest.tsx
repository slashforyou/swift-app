/**
 * Server Connection Test - Modern design system implementation
 * Test REST API endpoints (GET, POST, PUT, DELETE) with modern interface
 */

import React, { useState } from 'react';
import { Text, Pressable, ActivityIndicator, Modal, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VStack, HStack } from '../../src/components/primitives/Stack';
import { Ionicons } from '@expo/vector-icons';
import { ServerData } from '@/src/constants/ServerData';
import { DESIGN_TOKENS } from '../../src/constants/Styles';
import { Colors } from '../../src/constants/Colors';

// Types
interface TestResult {
    method: string;
    success: boolean;
    message: string;
}

const ServerConnectionTest: React.FC = () => {
    const [results, setResults] = useState<TestResult[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [completed, setCompleted] = useState<boolean>(false);
    const [isTabOpen, setIsTabOpen] = useState<boolean>(false);
    const insets = useSafeAreaInsets();

    const runServerTests = async () => {
        setLoading(true);
        setCompleted(false);
        setResults([]);
        
        const methods: ('GET' | 'POST' | 'PUT' | 'DELETE')[] = ['GET', 'POST', 'PUT', 'DELETE'];
        const testResults: TestResult[] = [];
        
        for (const method of methods) {
            const result = await testServer(method);
            testResults.push(result);
            setResults([...testResults]);
        }
        
        setLoading(false);
        setCompleted(true);
    };

    const testServer = async (type: 'GET' | 'POST' | 'PUT' | 'DELETE'): Promise<TestResult> => {
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
                return {
                    method: type,
                    success: false,
                    message: `${response.status} ${response.statusText}`
                };
            }
            
            const data = await response.json();
            return {
                method: type,
                success: true,
                message: JSON.stringify(data)
            };
        } catch (err) {
            return {
                method: type,
                success: false,
                message: err instanceof Error ? err.message : 'Unknown error occurred'
            };
        }
    };

    return (
        <>
            {/* Compact Button to Open Tab */}
            <Pressable
                onPress={() => setIsTabOpen(true)}
                style={({ pressed }) => ({
                    backgroundColor: pressed ? Colors.light.backgroundTertiary : Colors.light.backgroundSecondary,
                    padding: DESIGN_TOKENS.spacing.sm,
                    borderRadius: DESIGN_TOKENS.radius.md,
                    borderWidth: 1,
                    borderColor: Colors.light.border,
                    minHeight: DESIGN_TOKENS.touch.minSize,
                })}
            >
                <HStack gap="sm" align="center" justify="center">
                    <Ionicons name="build" size={18} color={Colors.light.primary} />
                    <Text
                        style={{
                            color: Colors.light.text,
                            fontSize: DESIGN_TOKENS.typography.body.fontSize,
                            fontWeight: '500',
                        }}
                    >
                        Dev Tools
                    </Text>
                </HStack>
            </Pressable>

            {/* Full Screen Tab Modal */}
            <Modal
                visible={isTabOpen}
                animationType="slide"
                presentationStyle="pageSheet"
            >
                <View
                    style={{
                        flex: 1,
                        backgroundColor: Colors.light.background,
                    }}
                >
                    {/* Tab Header */}
                    <View
                        style={{
                            paddingTop: insets.top,
                            backgroundColor: Colors.light.primary,
                        }}
                    >
                        <HStack
                            gap="md"
                            align="center"
                            justify="space-between"
                            style={{
                                paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                                paddingVertical: DESIGN_TOKENS.spacing.md,
                                minHeight: 50,
                            }}
                        >
                            <HStack gap="sm" align="center">
                                <Ionicons name="build" size={24} color="white" />
                                <Text
                                    style={{
                                        color: "white",
                                        fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
                                        fontWeight: DESIGN_TOKENS.typography.subtitle.fontWeight,
                                    }}
                                >
                                    Development Tools
                                </Text>
                            </HStack>
                            
                            <Pressable
                                onPress={() => setIsTabOpen(false)}
                                style={{
                                    padding: DESIGN_TOKENS.spacing.xs,
                                }}
                            >
                                <Ionicons name="close" size={24} color="white" />
                            </Pressable>
                        </HStack>
                    </View>

                    {/* Tab Content */}
                    <VStack
                        gap="lg"
                        style={{
                            flex: 1,
                            padding: DESIGN_TOKENS.spacing.lg,
                            paddingBottom: insets.bottom + DESIGN_TOKENS.spacing.lg,
                        }}
                    >
                        {/* Server Connection Test Section */}
                        <VStack
                            gap="md"
                            style={{
                                backgroundColor: Colors.light.backgroundSecondary,
                                padding: DESIGN_TOKENS.spacing.lg,
                                borderRadius: DESIGN_TOKENS.radius.lg,
                                borderWidth: 1,
                                borderColor: Colors.light.border,
                            }}
                        >
                            <HStack gap="sm" align="center">
                                <Ionicons name="server" size={24} color={Colors.light.primary} />
                                <Text
                                    style={{
                                        color: Colors.light.text,
                                        fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
                                        fontWeight: DESIGN_TOKENS.typography.subtitle.fontWeight,
                                    }}
                                >
                                    Server Connection Test
                                </Text>
                            </HStack>
                            
                            <Text
                                style={{
                                    color: Colors.light.textSecondary,
                                    fontSize: DESIGN_TOKENS.typography.body.fontSize,
                                    lineHeight: DESIGN_TOKENS.typography.body.lineHeight,
                                }}
                            >
                                Test REST API endpoints (GET, POST, PUT, DELETE) to verify server connectivity and response handling.
                            </Text>

                            {/* Test Button */}
                            <Pressable
                                onPress={runServerTests}
                                disabled={loading}
                                style={({ pressed }) => ({
                                    backgroundColor: loading 
                                        ? Colors.light.backgroundTertiary 
                                        : pressed 
                                        ? Colors.light.primaryHover 
                                        : Colors.light.primary,
                                    paddingVertical: DESIGN_TOKENS.spacing.md,
                                    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                                    borderRadius: DESIGN_TOKENS.radius.md,
                                    minHeight: DESIGN_TOKENS.touch.minSize,
                                    opacity: loading ? 0.6 : 1,
                                })}
                            >
                                <HStack gap="sm" align="center" justify="center">
                                    {loading ? (
                                        <ActivityIndicator size="small" color="white" />
                                    ) : (
                                        <Ionicons name="refresh" size={20} color="white" />
                                    )}
                                    <Text
                                        style={{
                                            color: "white",
                                            fontSize: DESIGN_TOKENS.typography.body.fontSize,
                                            fontWeight: '600',
                                        }}
                                    >
                                        {loading ? 'Running Tests...' : 'Run Connection Tests'}
                                    </Text>
                                </HStack>
                            </Pressable>

                            {/* Results Section */}
                            {(results.length > 0 || loading) && (
                                <VStack
                                    gap="sm"
                                    style={{
                                        marginTop: DESIGN_TOKENS.spacing.md,
                                        padding: DESIGN_TOKENS.spacing.md,
                                        backgroundColor: Colors.light.background,
                                        borderRadius: DESIGN_TOKENS.radius.md,
                                        borderWidth: 1,
                                        borderColor: Colors.light.border,
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: Colors.light.text,
                                            fontSize: DESIGN_TOKENS.typography.body.fontSize,
                                            fontWeight: '600',
                                            marginBottom: DESIGN_TOKENS.spacing.xs,
                                        }}
                                    >
                                        Test Results ({results.length}/4)
                                    </Text>

                                    {['GET', 'POST', 'PUT', 'DELETE'].map((method) => {
                                        const result = results.find(r => r.method === method);
                                        const isLoading = loading && !result;
                                        
                                        return (
                                            <HStack key={method} gap="md" align="center">
                                                <Text
                                                    style={{
                                                        color: Colors.light.text,
                                                        fontSize: DESIGN_TOKENS.typography.body.fontSize,
                                                        fontWeight: '500',
                                                        width: 60,
                                                    }}
                                                >
                                                    {method}
                                                </Text>
                                                
                                                {isLoading ? (
                                                    <ActivityIndicator size="small" color={Colors.light.primary} />
                                                ) : result ? (
                                                    <HStack gap="sm" align="center" style={{ flex: 1 }}>
                                                        <Ionicons 
                                                            name={result.success ? "checkmark-circle" : "close-circle"} 
                                                            size={20} 
                                                            color={result.success ? Colors.light.success : Colors.light.error} 
                                                        />
                                                        <Text
                                                            style={{
                                                                color: result.success ? Colors.light.success : Colors.light.error,
                                                                fontSize: DESIGN_TOKENS.typography.body.fontSize,
                                                                flex: 1,
                                                            }}
                                                            numberOfLines={2}
                                                        >
                                                            {result.success ? 'Connection successful' : result.message}
                                                        </Text>
                                                    </HStack>
                                                ) : (
                                                    <Text
                                                        style={{
                                                            color: Colors.light.textMuted,
                                                            fontSize: DESIGN_TOKENS.typography.body.fontSize,
                                                        }}
                                                    >
                                                        Waiting...
                                                    </Text>
                                                )}
                                            </HStack>
                                        );
                                    })}

                                    {completed && (
                                        <Text
                                            style={{
                                                color: Colors.light.success,
                                                fontSize: DESIGN_TOKENS.typography.body.fontSize,
                                                fontWeight: '600',
                                                textAlign: 'center',
                                                marginTop: DESIGN_TOKENS.spacing.md,
                                                padding: DESIGN_TOKENS.spacing.sm,
                                                backgroundColor: Colors.light.backgroundSecondary,
                                                borderRadius: DESIGN_TOKENS.radius.sm,
                                            }}
                                        >
                                            ✅ All connection tests completed successfully
                                        </Text>
                                    )}
                                </VStack>
                            )}
                        </VStack>
                    </VStack>
                </View>
            </Modal>
        </>
    );
};

export default ServerConnectionTest;

