/**
 * Error Boundary - Attrape les erreurs de rendu React
 * Affiche un message d'erreur au lieu d'un écran noir
 */
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

interface Props {
    children: ReactNode;
    fallback?: (error: Error, errorInfo: ErrorInfo) => ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        // Mettre à jour l'état pour afficher l'UI de fallback
        return {
            hasError: true,
            error,
            errorInfo: null,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Logger l'erreur
        console.error('❌ [ErrorBoundary] Error caught:', error);
        console.error('❌ [ErrorBoundary] Error info:', errorInfo);
        console.error('❌ [ErrorBoundary] Component stack:', errorInfo.componentStack);
        
        this.setState({
            error,
            errorInfo,
        });
    }

    resetError = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render() {
        if (this.state.hasError) {
            // UI de fallback personnalisée
            if (this.props.fallback && this.state.error && this.state.errorInfo) {
                return this.props.fallback(this.state.error, this.state.errorInfo);
            }

            // UI de fallback par défaut
            return (
                <View style={{ 
                    flex: 1, 
                    backgroundColor: '#1a1a1a', 
                    padding: 20,
                    justifyContent: 'center',
                }}>
                    <View style={{
                        backgroundColor: '#ff4444',
                        padding: 16,
                        borderRadius: 8,
                        marginBottom: 16,
                    }}>
                        <Text style={{ 
                            color: '#ffffff', 
                            fontSize: 20, 
                            fontWeight: '700',
                            marginBottom: 8,
                        }}>
                            ❌ Erreur de rendu React
                        </Text>
                        <Text style={{ 
                            color: '#ffffff', 
                            fontSize: 14,
                        }}>
                            {this.state.error?.message || 'Erreur inconnue'}
                        </Text>
                    </View>

                    <ScrollView style={{
                        backgroundColor: '#2a2a2a',
                        borderRadius: 8,
                        padding: 12,
                        maxHeight: 300,
                    }}>
                        <Text style={{ 
                            color: '#ffffff', 
                            fontSize: 12,
                            fontFamily: 'monospace',
                        }}>
                            {this.state.error?.stack}
                        </Text>
                        
                        {this.state.errorInfo && (
                            <>
                                <Text style={{ 
                                    color: '#ffa500', 
                                    fontSize: 14,
                                    fontWeight: '600',
                                    marginTop: 16,
                                    marginBottom: 8,
                                }}>
                                    Component Stack:
                                </Text>
                                <Text style={{ 
                                    color: '#cccccc', 
                                    fontSize: 11,
                                    fontFamily: 'monospace',
                                }}>
                                    {this.state.errorInfo.componentStack}
                                </Text>
                            </>
                        )}
                    </ScrollView>

                    <Pressable
                        onPress={this.resetError}
                        style={({ pressed }) => ({
                            backgroundColor: pressed ? '#0066cc' : '#0077ff',
                            padding: 16,
                            borderRadius: 8,
                            marginTop: 16,
                            alignItems: 'center',
                        })}
                    >
                        <Text style={{ 
                            color: '#ffffff', 
                            fontSize: 16,
                            fontWeight: '600',
                        }}>
                            🔄 Réessayer
                        </Text>
                    </Pressable>
                </View>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
