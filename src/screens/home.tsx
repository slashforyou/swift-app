import { View, Text } from 'react-native';
import HomeButton from '../components/ui/home_button';

function HomeScreen({ navigation }: any) {
    const style = {
        logo: {
            width: 100,
            height: 100,
            backgroundColor: 'rgb(215, 36, 36)',
            borderRadius: 50,
            marginBottom: 20,
            justifyContent: 'center',
            alignItems: 'center',
        },
    };
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={style.logo}>
            </View>

        <HomeButton
            title="Calendar"
            onPress={() => navigation.navigate('Calendar')}
        />
        <HomeButton
            title="Profile"
            onPress={() => navigation.navigate('Profile')}
        />
        <HomeButton
            title="Parameter"
            onPress={() => navigation.navigate('Parameter')}
        />
    </View>
  )
}

export default HomeScreen;