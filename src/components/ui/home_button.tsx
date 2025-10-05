import { Pressable, Text, StyleSheet } from "react-native";
import { useCommonThemedStyles } from '../../hooks/useCommonStyles';

type HomeButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'default' | 'large';
};

const HomeButton = ({ title, onPress, disabled = false, variant = 'primary', size = 'default' }: HomeButtonProps) => {
    const { colors, styles: commonStyles } = useCommonThemedStyles();

    // Get the appropriate button style based on variant and size
    const getButtonStyle = () => {
        let baseStyle: any = commonStyles.buttonPrimary;
        let textStyle: any = commonStyles.buttonPrimaryText;
        
        if (variant === 'secondary') {
            baseStyle = commonStyles.buttonSecondary;
            textStyle = commonStyles.buttonSecondaryText;
        } else if (variant === 'outline') {
            baseStyle = commonStyles.buttonOutline;
            textStyle = commonStyles.buttonOutlineText;
        }
        
        if (size === 'large') {
            baseStyle = variant === 'primary' ? commonStyles.buttonPrimaryLarge : baseStyle;
            textStyle = variant === 'primary' ? commonStyles.buttonPrimaryTextLarge : textStyle;
        }
        
        return { baseStyle, textStyle };
    };

    const { baseStyle, textStyle } = getButtonStyle();

    return (
        <Pressable
            style={[
                baseStyle,
                { 
                    opacity: disabled ? 0.5 : 1,
                    width: '80%',
                    maxWidth: 300,
                }
            ]}
            onPress={onPress}
            disabled={disabled}
        >
            <Text style={textStyle}>{title}</Text>
        </Pressable>
    );
}

export default HomeButton;