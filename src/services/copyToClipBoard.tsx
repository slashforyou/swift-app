// CopyToClipBoard service to copy text to clipboard

import * as Clipboard from 'expo-clipboard';
const copyToClipBoard = async (text: string): Promise<void> => {
    try {
        await Clipboard.setStringAsync(text);
        // TEMP_DISABLED: console.log(`Text copied to clipboard: ${text}`);
    } catch (error) {
        console.error('Failed to copy text to clipboard:', error);
    }
}

export default copyToClipBoard;