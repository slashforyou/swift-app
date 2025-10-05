import { Pressable, Text, StyleSheet } from "react-native";
import { useThemedStyles, useThemeColors } from '../../../hooks/useThemeColor';

type HomeButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
};

const HomeButton = ({ title, onPress, disabled = false }: HomeButtonProps) => {
    const colors = useThemeColors();

    const createStyles = (colors: any) =>
        StyleSheet.create({
            homeButton: {
                backgroundColor: colors.primary,
                padding: 10,
                borderRadius: 5,
                alignItems: 'center',
                justifyContent: 'center',
                marginVertical: 5,
                opacity: disabled ? 0.5 : 1,
                width: '80%',
                maxWidth: 300,
            },
            buttonText: {
                color: colors.buttonPrimaryText,
                fontSize: 16,
            },
        });

    const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={styles.homeButton}
    >
        <Text style={styles.buttonText}>
      {title}
    </Text>
    </Pressable>
  );
}

export default HomeButton;