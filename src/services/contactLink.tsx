// contactLink service to contact a person via phone, sms, or email
// This service uses Expo's Linking API to open URLs for phone calls, SMS, or email.

import * as Linking from 'expo-linking';

const contactLink = async (link: string, type: string): Promise<void> => {
    const url = `${type}:${link}`;
    try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
            await Linking.openURL(url);
        } else {
            console.error(`The URL ${url} is not supported`);
        }
    } catch (error) {
        console.error('Failed to open URL:', error);
    }
};

export default contactLink;
