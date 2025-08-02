import Navigation from "@/src/navigation/index";
import { View, Pressable, Text } from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import React from 'react';

const TopMenu = ({ navigation }: any) => {
    const style = {
        topMenu: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            padding: 10,
            paddingTop: 25,
            backgroundColor: 'rgb(215, 36, 36)',
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(0, 0, 0, 0.1)',
            position: 'absolute',
            top: 0,
            zIndex: 1000,
            elevation: 5,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
        },
        backButton: {
            padding: 10,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 5,
        },
        backButtonText: {
            color: '#FFF',
            fontSize: 16,
        },
    };
  return (
    <View style={style.topMenu}>
      <Pressable style={style.backButton} onPress={() => navigation.navigate('Home')}>
        <Text style={style.backButtonText}>
          <Ionicons name="home" size={24} color="#FFF" />
        </Text>
      </Pressable>
    </View>
  );
}

export default TopMenu;