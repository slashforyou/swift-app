// The payment window is where the user can finalize the payment for the job.
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions, TextInput, StyleSheet } from 'react-native';
import DropDownPicker, { ItemType } from 'react-native-dropdown-picker';
import { Ionicons } from '@expo/vector-icons';
import { useThemedStyles, useThemeColors } from '../../../hooks/useThemeColor';
import { Colors } from '../../constants/Colors';

const PaymentWindow = ({ job, status, setPaymentStatus }: { job: any, status: boolean, setPaymentStatus: (status: boolean) => void }) => {

    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;

    const [cashAmount, setCashAmount] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [cvv, setCvv] = useState('');
    const [cardHolderName, setCardHolderName] = useState('');

    const [dropDownCardopen, dropDownCardSetOpen] = useState(false);
    const [dropDownCardValue, setDropDownCardValue] = useState<string | null>(null);
    const [dropDownCarditems, dropDownCardSetItems] = useState<ItemType[]>(job.payment.savedCards.map((card: any) => ({
        label: `${card.cardHolderName} - **** ${card.cardNumber.slice(-4)}`, // Display card holder name and last 4 digits
        value: card.id, // Use card ID as value
        cardNumber: card.cardNumber,
        expiryDate: card.expiryDate,
        cardHolderName: card.cardHolderName,
    })));

    const Style = {
        paymentWindowMask: {
            display: status  ? 'flex' : 'none',
            zIndex: 10000,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            width: screenWidth,
            height: screenHeight,
        },
        paymentWindowCloser: {
            marginBottom: 20,
            width: '90%',
            display: 'flex',
            flexDirection: 'row-reverse',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 10001,
        },
        paymentWindowCloseButton: {
            backgroundColor: '#fc6d6bff',
            borderRadius: 5,
            padding: 10,
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
        },
        paymentWindowBackButton: {
            backgroundColor: '#fff',
            borderRadius: 5,
            padding: 10,
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
        },
        paymentWindowContainer: {
            width: '90%',
            height: '50%',
            backgroundColor: '#fff',
            borderRadius: 10,
            padding: 20,
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
        },
        paymentWindowContainerScroll: {
            flexGrow: 1,
            justifyContent: 'flex-start',
            alignItems: 'center',
            height: '50%',
        },
        paymentStep1: {
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
        },
        paymentStep2Scroll: {
            flexGrow: 1,
            justifyContent: 'flex-start',
            alignItems: 'center',
            paddingBottom: 20,

        },
        paymentStep2: {
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
        },
        paymentStep3: {
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
        },
        paymentConfirmation: {
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
        },
        paymentConfirmationTitle: {
            fontSize: 24,
            fontWeight: 'bold',
            marginBottom: 10,
            textAlign: 'center',
            color: '#333',
        },
        paymentConfirmationInfo: {
            fontSize: 16,
            textAlign: 'center',
            color: '#666',
            marginBottom: 20,
        },
        paymentStepTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            marginBottom: 20,
            textAlign: 'center',
            color: '#333',
        },
        paymentMethodButton: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 10,
            paddingHorizontal: 15,
            backgroundColor: '#f0f0f0',
            borderRadius: 5,
            marginBottom: 10,
        },
        paymentMethodText: {
            flexGrow: 1,
            fontSize: 16,
        },
        confirmPaymentButton: {
            backgroundColor: '#007AFF',
            paddingVertical: 10,
            paddingHorizontal: 15,
            borderRadius: 5,
            alignItems: 'center',
        },
        confirmPaymentText: {
            color: '#fff',
            fontSize: 16,
        },
        cashPaymentInfo: {
            fontSize: 14,
            color: '#666',
            marginBottom: 10,
            textAlign: 'center',
        },
        cashPaymentInfos: {
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            marginBottom: 20,
            borderWidth: 1,
            borderRadius: 5,
            borderColor: '#ddd',
            paddingVertical: 20,
            backgroundColor: '#f9f9f9',
            width: '100%',
        },
        cashPaymentInfoAmount: {
            fontSize: 14,
            color: '#333',
            paddingVertical: 5,
            paddingHorizontal: 10,
            borderBottomWidth: 1,
            borderBottomColor: '#ddd',
            borderStyle: 'dashed',
            width: '100%',
        },
        cashPaymentInput: {
            height: 40,
            borderColor: '#ccc',
            borderWidth: 1,
            borderRadius: 5,
            paddingHorizontal: 10,
            marginTop: 10,
            marginBottom: 20,
            width: '100%',
        },
        creditCardInfos: {
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
            borderWidth: 1,
            borderRadius: 5,
            borderColor: '#ddd',
            paddingVertical: 10,
            backgroundColor: '#f9f9f9',
            paddingHorizontal: 10,
            flexWrap: 'wrap',
            gap: 10,
        },
        creditCardInputNumber: {
            height: 40,
            borderColor: '#ccc',
            borderWidth: 1,
            borderRadius: 5,
            paddingHorizontal: 10,
            marginBottom: 10,
            width: '100%',
        },
        creditCardInputDate: {
            height: 40,
            borderColor: '#ccc',
            borderWidth: 1,
            borderRadius: 5,
            paddingHorizontal: 10,
            marginBottom: 10,
            width: '48%',
        },
        creditCardInputCvv: {
            height: 40,
            borderColor: '#ccc',
            borderWidth: 1,
            borderRadius: 5,
            paddingHorizontal: 10,
            marginBottom: 10,
            width: '48%',
        },
        creditCardInputHolderName: {
            height: 40,
            borderColor: '#ccc',
            borderWidth: 1,
            borderRadius: 5,
            paddingHorizontal: 10,
            marginBottom: 20,
            width: '100%',
        },
        cardPaymentTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: '#333',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-start',
        },
        cardPaymentTitleIcon: {
            marginRight: 10,
        },
        cardPaymentTitleText: {
            fontSize: 18,
            fontWeight: 'bold',
            color: '#333',
        },
        dropdown: {
            height: 40,
            borderColor: '#ccc',
            borderWidth: 1,
            borderRadius: 5,
            paddingHorizontal: 10,
            marginBottom: 20,
            width: '100%',
        },
        dropdownContainer: {
            borderColor: '#ccc',
            borderWidth: 1,
            borderRadius: 5,
            backgroundColor: '#fff',
        },
        placeholder: {
            color: '#999',
            fontSize: 14,
        },
        selectedItem: {
            color: '#000',
            fontSize: 14,
        },
        itemLabel: {
            color: '#000',
            fontSize: 14,
        },
    };
    const [paymentStep, setPaymentStep] = useState(1);

    return (
        <View style={Style.paymentWindowMask}>
            <View style={Style.paymentWindowCloser}>


                <Pressable onPress={() => setPaymentStatus(false)} style={ Style.paymentWindowCloseButton }>
                    <Ionicons name="close" size={24} color="#fff" />
                </Pressable>
                {
                    paymentStep > 1 ? (
                        <Pressable onPress={() => setPaymentStep(1)} style={ Style.paymentWindowBackButton }>
                            <Ionicons name="chevron-back" size={24} color="#333" />
                        </Pressable>
                    ) : null
                }
            </View>
            <View style={Style.paymentWindowContainer} contentContainerStyle={ Style.paymentWindowContainerScroll }>
                {                paymentStep === 1 ? (
                    <View style={Style.paymentStep1}>
                        <Text style={Style.paymentStepTitle}>Choose Payment Method</Text>
                        <Pressable style={Style.paymentMethodButton} onPress={() => setPaymentStep(2)}>
                            <Text style={Style.paymentMethodText}>Credit Card</Text>
                            <Ionicons name="card" size={24} color="#000" />
                        </Pressable>
                        <Pressable style={Style.paymentMethodButton} onPress={() => setPaymentStep(3)}>
                            <Text style={Style.paymentMethodText}>Cash</Text>
                            <Ionicons name="cash" size={24} color="#000" />
                        </Pressable>
                    </View>
                ) : paymentStep === 2 ? (
                    <ScrollView style={Style.paymentStep2} contentContainerStyle={Style.paymentStep2Scroll}>
                        <Text style={Style.paymentStepTitle}>Enter Credit Card Details</Text>
                        {/* TODO : Implement credit card form (Stripe) */}

                        <Text style={Style.cashPaymentInfo}>Please enter your credit card details to proceed with the payment.</Text>
                        <View style={Style.cashPaymentInfos}>
                            <Text style={Style.cashPaymentInfoAmount}>Total Amount: {job.payment.amount} {job.payment.currency}</Text>
                            <Text style={Style.cashPaymentInfoAmount}>Amount Due: {job.payment.amountToBePaid} {job.payment.currency}</Text>
                            <Text style={Style.cashPaymentInfoAmount}>GST: {job.payment.taxe.gst} ({job.payment.taxe.gstRate}%)</Text>
                            <Text style={Style.cashPaymentInfoAmount}>Amount Without Tax: {job.payment.taxe.amountWithoutTax} {job.payment.currency}</Text>
                        </View>
                        <View style={Style.creditCardInfos}>

                            <View style={Style.cardPaymentTitle}>
                                <Ionicons name="card" size={20} color="#000" style={ Style.cardPaymentTitleIcon } />
                                <Text style={ Style.cardPaymentTitleText }>Credit Card Details</Text>
                            </View>

                            {/* Input to choose a card already saved */}
                            <DropDownPicker
                            open={dropDownCardopen}
                            value={dropDownCardValue}
                            items={dropDownCarditems}
                            setOpen={dropDownCardSetOpen}
                            setValue={setDropDownCardValue}
                            setItems={dropDownCardSetItems}
                            placeholder="Registered cards"
                            style={Style.dropdown}
                            dropDownContainerStyle={Style.dropdownContainer}
                            placeholderStyle={Style.placeholder}
                            selectedItemLabelStyle={Style.selectedItem}
                            listItemLabelStyle={Style.itemLabel}
                            onChangeValue={(value) => {
                                const selectedCard = dropDownCarditems.find(item => item.value === value);
                                if (selectedCard) {
                                    const cardDetails = selectedCard.label.split(' ');
                                    setCardNumber(selectedCard.cardNumber);
                                    setExpiryDate(selectedCard.expiryDate);
                                    setCardHolderName(selectedCard.cardHolderName);
                                    // You can also set CVV if needed, but it's not recommended to store CVV for security reasons
                                    setCvv(''); // Clear CVV as it's sensitive information
                                    dropDownCardSetOpen(false); // Close the dropdown after selection

                                }
                            }}
                            />
                            

                            <TextInput
                                style={Style.creditCardInputNumber}
                                placeholder="Card Number"
                                keyboardType="numeric"
                                value={cardNumber}
                                onChangeText={setCardNumber}
                            />
                            <TextInput
                                style={Style.creditCardInputDate}
                                placeholder="Expiry Date (MM/YY)"
                                keyboardType="numeric"
                                value={expiryDate}
                                onChangeText={setExpiryDate}
                            />
                            <TextInput
                                style={Style.creditCardInputCvv}
                                placeholder="CVV"
                                keyboardType="numeric"
                                value={cvv}
                                onChangeText={setCvv}
                            />
                            <TextInput
                                style={Style.creditCardInputHolderName}
                                placeholder="Card Holder Name"
                                value={cardHolderName}
                                onChangeText={setCardHolderName}
                            />
                        </View>
                        <Text style={Style.cashPaymentInfo}>Please review your details before confirming the payment.</Text>
                        <Pressable style={Style.confirmPaymentButton} onPress={() => setPaymentStep(4)}>
                            <Text style={Style.confirmPaymentText}>Confirm Payment</Text>
                        </Pressable>
                    </ScrollView>
                ) : paymentStep === 3 ? (
                    <View style={Style.paymentStep3}>
                        <Text style={Style.paymentStepTitle}>Cash Payment</Text>
                        <Text style={Style.cashPaymentInfo}>Please prepare the cash amount.</Text>

                        <View style={ Style.cashPaymentInfos }>
                            <Text style={Style.cashPaymentInfoAmount}>Total Amount: {job.payment.amount} {job.payment.currency}</Text>
                            <Text style={Style.cashPaymentInfoAmount}>Amount Due: {job.payment.amountToBePaid} {job.payment.currency}</Text>
                            <Text style={Style.cashPaymentInfoAmount}>GST: {job.payment.taxe.gst} ({job.payment.taxe.gstRate}%)</Text>
                            <Text style={Style.cashPaymentInfoAmount}>Amount Without Tax: {job.payment.taxe.amountWithoutTax} {job.payment.currency}</Text>

                        </View>

                        {/* Input field for cash amount */}
                        <TextInput
                            style={Style.cashPaymentInput}
                            placeholder="Enter cash amount"
                            keyboardType="numeric"
                            value={cashAmount}
                            onChangeText={setCashAmount}
                        />

                        <Pressable style={Style.confirmPaymentButton} onPress={() => setPaymentStep(4)}>
                            <Text style={Style.confirmPaymentText}>Confirm Cash Payment</Text>
                        </Pressable>
                    </View>
                ) : (
                    <View style={Style.paymentConfirmation}>
                        <Text style={Style.paymentConfirmationTitle}>Payment Confirmed!</Text>
                        <Text style={Style.paymentConfirmationInfo}>Thank you for your payment.</Text>
                        <Text style={Style.paymentConfirmationInfo}>You will receive a confirmation email shortly.</Text>
                    </View>
                )}
            </View>
        </View>
    )
}
export default PaymentWindow;