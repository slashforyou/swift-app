import { Pressable, Text } from "react-native";

type HomeButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
};

const HomeButton = ({ title, onPress, disabled = false }: HomeButtonProps) => {
    const HomeButtonStyle = {
  backgroundColor:'rgb(215, 36, 36)',
  padding: 10,
  borderRadius: 5,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  marginVertical: 5,
  opacity: disabled ? 0.5 : 1,
  width: '80%',
  maxWidth: 300,
};

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={HomeButtonStyle}
    >
        <Text style={{ color: 'white', fontSize: 16 }}>
      {title}
    </Text>
    </Pressable>
  );
}

export default HomeButton;