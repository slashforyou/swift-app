/**
 * Summary Page - Refactorisé selon meilleures pratiques UI mobiles
 * Utilise Screen, VStack, Card, Button, Typography conformes
 */

import React from 'react';
import { ScrollView, Pressable } from 'react-native';
import { 
  Screen, 
  VStack, 
  HStack, 
  Card, 
  Button, 
  Title, 
  Subtitle, 
  Body, 
  Muted 
} from '../../components';
import SigningBloc from '@/src/components/signingBloc';
import JobTimeLine from '@/src/components/ui/jobPage/jobTimeLine';
import { useCommonThemedStyles, DESIGN_TOKENS } from '../../constants/Styles';
import { useTheme } from '../../context/ThemeProvider';
import contactLink from '@/src/services/contactLink';
import copyToClipBoard from '@/src/services/copyToClipBoard';
import openMap from '@/src/services/openMap';

const JobSummary = ({ job, setJob } : { job: any, setJob: React.Dispatch<React.SetStateAction<any>> }) => {
    const { colors } = useTheme();
    const styles = useCommonThemedStyles();
    const [isSigningVisible, setIsSigningVisible] = React.useState(false);

    return (
        <>
        {isSigningVisible && (
        <SigningBloc 
            isVisible={isSigningVisible} 
            setIsVisible={setIsSigningVisible} 
            onSave={(signature: any) => console.log('Signature saved:', signature)} 
            job={job} 
            setJob={setJob}
        />
        )}
        <Screen>
            <ScrollView showsVerticalScrollIndicator={false}>
                <VStack gap="xl">
                
                    {/* Job Timeline */}
                    <Card>
                        <VStack gap="lg">
                            <Title>Job Summary</Title>
                            <JobTimeLine job={job} />
                        </VStack>
                    </Card>
                    
                    {/* Signature Status */}
                    <Card>
                        <VStack gap="lg">
                            <Title>Signature Status</Title>
                            {job.signatureDataUrl !== '' && job.signatureFileUri !== '' ? (
                                <Body style={{ color: colors.success }}>
                                    ✅ The client has signed the contract.
                                </Body>
                            ) : (
                                <VStack gap="md">
                                    <Muted>⚠️ The client has not signed the contract.</Muted>
                                    <Button 
                                        title="Sign Contract" 
                                        variant="secondary" 
                                        onPress={() => setIsSigningVisible(true)}
                                    />
                                </VStack>
                            )}
                        </VStack>
                    </Card>
                    
                    {/* Client Information */}
                    <Card>
                        <VStack gap="lg">
                            <Title>Client Details</Title>
                            
                            <VStack gap="sm">
                                <Muted>Client Name</Muted>
                                <Body>{job.client.firstName} {job.client.lastName}</Body>
                            </VStack>
                            
                            <VStack gap="sm">
                                <Muted>Phone Number</Muted>
                                <Pressable 
                                    onPress={() => copyToClipBoard(job.client.phone)}
                                    hitSlop={{
                                        top: DESIGN_TOKENS.touch.hitSlop,
                                        bottom: DESIGN_TOKENS.touch.hitSlop,
                                        left: DESIGN_TOKENS.touch.hitSlop,
                                        right: DESIGN_TOKENS.touch.hitSlop,
                                    }}
                                >
                                    <Body style={{ color: colors.primary }}>{job.client.phone}</Body>
                                </Pressable>
                            </VStack>
                            
                            <Button 
                                title="📞 Call Client" 
                                variant="secondary" 
                                onPress={() => contactLink(job.client.phone, 'tel')}
                            />
                        </VStack>
                    </Card>

                    {/* Contact Information */}
                    <Card>
                        <VStack gap="lg">
                            <Title>Contact Person</Title>
                            
                            <VStack gap="sm">
                                <Muted>Contact Name</Muted>
                                <Body>{job.contact.firstName} {job.contact.lastName}</Body>
                            </VStack>
                            
                            <VStack gap="sm">
                                <Muted>Phone Number</Muted>
                                <Pressable 
                                    onPress={() => copyToClipBoard(job.contact.phone)}
                                    hitSlop={{
                                        top: DESIGN_TOKENS.touch.hitSlop,
                                        bottom: DESIGN_TOKENS.touch.hitSlop,
                                        left: DESIGN_TOKENS.touch.hitSlop,
                                        right: DESIGN_TOKENS.touch.hitSlop,
                                    }}
                                >
                                    <Body style={{ color: colors.primary }}>{job.contact.phone}</Body>
                                </Pressable>
                            </VStack>
                            
                            <Button 
                                title="📞 Call Contact" 
                                variant="secondary" 
                                onPress={() => contactLink(job.contact.phone, 'tel')}
                            />
                        </VStack>
                    </Card>

                    {/* Addresses */}
                    <Card>
                        <VStack gap="lg">
                            <Title>Addresses</Title>
                            
                            {job.addresses.length > 0 ? (
                                <VStack gap="md">
                                    {job.addresses.map((address: any, index: number) => (
                                        <Pressable 
                                            key={index} 
                                            onPress={() => openMap(address.street, address.latitude, address.longitude)}
                                            style={[styles.card, { backgroundColor: colors.backgroundSecondary }]}
                                            hitSlop={{
                                                top: DESIGN_TOKENS.touch.hitSlop,
                                                bottom: DESIGN_TOKENS.touch.hitSlop,
                                                left: DESIGN_TOKENS.touch.hitSlop,
                                                right: DESIGN_TOKENS.touch.hitSlop,
                                            }}
                                        >
                                            <VStack gap="sm">
                                                <Muted>Address {index + 1}</Muted>
                                                <Body>📍 {address.street}, {address.city}, {address.state} {address.zip}</Body>
                                            </VStack>
                                        </Pressable>
                                    ))}
                                </VStack>
                            ) : (
                                <Body style={{ color: colors.textMuted }}>No addresses available</Body>
                            )}
                        </VStack>
                    </Card>

                    {/* Time Windows */}
                    <Card>
                        <VStack gap="lg">
                            <Title>Time Windows</Title>
                            
                            <VStack gap="md">
                                <VStack gap="sm">
                                    <Muted>Start Window</Muted>
                                    <Body>🕐 {new Date(job.time.startWindowStart).toLocaleString()} - {new Date(job.time.startWindowEnd).toLocaleString()}</Body>
                                </VStack>
                                
                                <VStack gap="sm">
                                    <Muted>End Window</Muted>
                                    <Body>🕐 {new Date(job.time.endWindowStart).toLocaleString()} - {new Date(job.time.endWindowEnd).toLocaleString()}</Body>
                                </VStack>
                            </VStack>
                        </VStack>
                    </Card>

                    {/* Truck Details */}
                    <Card>
                        <VStack gap="lg">
                            <Title>Truck Details</Title>
                            
                            <VStack gap="md">
                                <VStack gap="sm">
                                    <Muted>License Plate</Muted>
                                    <Body>🚚 {job.truck.licensePlate}</Body>
                                </VStack>
                                
                                <VStack gap="sm">
                                    <Muted>Truck Name</Muted>
                                    <Body>🚛 {job.truck.name}</Body>
                                </VStack>
                            </VStack>
                        </VStack>
                    </Card>
                    
                </VStack>
            </ScrollView>
        </Screen>
        </>
    );
};

export default JobSummary;
