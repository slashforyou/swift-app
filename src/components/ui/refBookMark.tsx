
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import copyToClipBoard from '../../services/copyToClipBoard';


const RefBookMark = ({ jobRef, toastIt }: { jobRef: string, toastIt: any }) => {
    const Style = {
        refBookMarkContainer: {
            padding: 10,
            backgroundColor: '#999',
            justifyContent: 'center',
            width: '80%',
            marginLeft: '10%',
            position: 'absolute',
            top: 75,
            left: 0,
            borderTopLeftRadius: 10,
            borderBottomLeftRadius: 10,
            borderTopRightRadius: 10,
            borderBottomRightRadius: 10,
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
            zIndex: 100,
            alignItems: 'center',
            flexDirection: 'row',
            
        },
        refBookMarkText: {
            fontSize: 16,
            color: '#fff',
            textAlign: 'center',
        }
    };

    const copyRefToClipboard = () => {
        // Function to copy the job reference to clipboard
        // This can be implemented using Clipboard API or any other method

        copyToClipBoard(jobRef);
        toastIt(`Job Ref. ${jobRef} copied to clipboard`, 'success', true);
    }

    return (
        <Pressable style={Style.refBookMarkContainer} onPress={copyRefToClipboard}>
            <Text style={Style.refBookMarkText}> Job Ref. { jobRef }</Text>
        </Pressable>
    );
}

export default RefBookMark;