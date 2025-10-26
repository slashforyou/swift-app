// openMap ouvre la carte à partir d'une adresse ou d'une position GPS
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
const label = "Location"; // Default label for the map location

const openMap = async (address: string, latitude?: number, longitude?: number): Promise<void> => {
    let url: string;

    const scheme = Platform.select({
      ios: `maps:0,0?q=${label}@${latitude},${longitude}`, // Apple Maps
      android: `geo:0,0?q=${latitude},${longitude}(${label})`, // Google Maps
    });

    if (latitude && longitude && scheme) {
        url = scheme;
    } else {
        url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    }

    try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
            await Linking.openURL(url);
        } else {
            console.log("Unsupported URL:", url);
        }
    } catch (error) {
        console.error("Error opening map:", error);
    }
};

export default openMap;
