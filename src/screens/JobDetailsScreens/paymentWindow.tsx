// The payment window is where the user can finalize the payment for the job.
import { useCommonThemedStyles } from '../../hooks/useCommonStyles';
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions, TextInput } from 'react-native';
import DropDownPicker, { ItemType } from 'react-native-dropdown-picker';
import { Ionicons } from '@expo/vector-icons';

interface CardItem extends ItemType<string> {
    cardNumber?: string;
    expiryDate?: string;
    cardHolderName?: string;
}

function PaymentWindow({ job, visibleCondition, setVisibleCondition }: any) {
    const { colors, styles } = useCommonThemedStyles();

    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;

    const [cashAmount, setCashAmount] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [cvv, setCvv] = useState('');
    const [cardHolderName, setCardHolderName] = useState('');

    const [dropDownCardopen, dropDownCardSetOpen] = useState(false);
    const [dropDownCardValue, setDropDownCardValue] = useState<string | null>(null);
    const [dropDownCarditems, dropDownCardSetItems] = useState<CardItem[]>(job.payment.savedCards.map((card: any) => ({
        label: `${card.cardHolderName} - **** ${card.cardNumber.slice(-4)}`, // Display card holder name and last 4 digits
        value: card.id, // Use card ID as value
        cardNumber: card.cardNumber,
        expiryDate: card.expiryDate,
        cardHolderName: card.cardHolderName,
    })));

    const [paymentStep, setPaymentStep] = useState(1);
    const status = visibleCondition === 'paymentWindow';

    if (!status) return null;

    return (
        <View style={[styles.modalOverlay, { width: screenWidth, height: screenHeight }]}>
            <View style={[styles.rowReverse, styles.padding16, styles.itemsCenter, { width: '90%', marginBottom: 20 }]}>
                <Pressable onPress={() => setVisibleCondition(null)} style={[styles.button, { backgroundColor: colors.error }]}>
                    <Ionicons name="close" size={24} color="white" />
                </Pressable>
                {
                    paymentStep > 1 ? (
                        <Pressable onPress={() => setPaymentStep(1)} style={[styles.button, { backgroundColor: colors.background }]}>
                            <Ionicons name="chevron-back" size={24} color={colors.text} />
                        </Pressable>
                    ) : null
                }
            </View>
            <View style={[styles.card, { width: '90%', height: '50%' }]}>
                {paymentStep === 1 ? (
                    <View style={[styles.container, styles.itemsCenter]}>
                        <Text style={[styles.h2, styles.textCenter, styles.marginBottom]}>Choose Payment Method</Text>
                        <Pressable style={[styles.listItem, styles.marginBottom]} onPress={() => setPaymentStep(2)}>
                            <Text style={[styles.body, { flex: 1 }]}>Credit Card</Text>
                            <Ionicons name="card" size={24} color={colors.primary} />
                        </Pressable>
                        <Pressable style={[styles.listItem, styles.marginBottom]} onPress={() => setPaymentStep(3)}>
                            <Text style={[styles.body, { flex: 1 }]}>Cash</Text>
                            <Ionicons name="cash" size={24} color={colors.primary} />
                        </Pressable>
                    </View>
                ) : paymentStep === 2 ? (
                    <ScrollView style={{ width: '100%' }} contentContainerStyle={[styles.containerCentered, { paddingBottom: 20 }]}>
                        <Text style={[styles.h2, styles.textCenter, styles.marginBottom]}>Enter Credit Card Details</Text>
                        {/* TODO : Implement credit card form (Stripe) */}

                        <Text style={[styles.body, styles.textCenter, styles.marginBottom, { color: colors.textSecondary }]}>Please enter your credit card details to proceed with the payment.</Text>
                        <View style={[styles.card, styles.marginBottom]}>
                            <Text style={[styles.listItemTitle, styles.marginBottom]}>Total Amount: {job.payment.amount} {job.payment.currency}</Text>
                            <Text style={[styles.listItemTitle, styles.marginBottom]}>Amount Due: {job.payment.amountToBePaid} {job.payment.currency}</Text>
                            <Text style={[styles.listItemTitle, styles.marginBottom]}>GST: {job.payment.taxe.gst} ({job.payment.taxe.gstRate}%)</Text>
                            <Text style={[styles.listItemTitle, styles.marginBottom]}>Amount Without Tax: {job.payment.taxe.amountWithoutTax} {job.payment.currency}</Text>
                        </View>
                        <View style={[styles.card, styles.marginBottom]}>

                            <View style={[{ flexDirection: 'row' }, styles.itemsCenter, styles.marginBottom]}>
                                <Ionicons name="card" size={20} color={colors.primary} style={{ marginRight: 10 }} />
                                <Text style={styles.h3}>Credit Card Details</Text>
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
                            style={[styles.input, styles.marginBottom]}
                            dropDownContainerStyle={styles.card}
                            placeholderStyle={{ color: colors.textMuted }}
                            selectedItemLabelStyle={{ color: colors.text }}
                            listItemLabelStyle={{ color: colors.text }}
                            onChangeValue={(value) => {
                                const selectedCard = dropDownCarditems.find(item => item.value === value);
                                if (selectedCard) {
                                    setCardNumber(selectedCard.cardNumber || '');
                                    setExpiryDate(selectedCard.expiryDate || '');
                                    setCardHolderName(selectedCard.cardHolderName || '');
                                    // You can also set CVV if needed, but it's not recommended to store CVV for security reasons
                                    setCvv(''); // Clear CVV as it's sensitive information
                                    dropDownCardSetOpen(false); // Close the dropdown after selection
                                }
                            }}
                            />
                            

                            <TextInput
                                style={[styles.input, styles.marginBottom]}
                                placeholder="Card Number"
                                placeholderTextColor={colors.textMuted}
                                keyboardType="numeric"
                                value={cardNumber}
                                onChangeText={setCardNumber}
                            />
                            <View style={[{ flexDirection: 'row' }, styles.gap8]}>
                                <TextInput
                                    style={[styles.input, { flex: 1 }]}
                                    placeholder="Expiry Date (MM/YY)"
                                    placeholderTextColor={colors.textMuted}
                                    keyboardType="numeric"
                                    value={expiryDate}
                                    onChangeText={setExpiryDate}
                                />
                                <TextInput
                                    style={[styles.input, { flex: 1 }]}
                                    placeholder="CVV"
                                    placeholderTextColor={colors.textMuted}
                                    keyboardType="numeric"
                                    value={cvv}
                                    onChangeText={setCvv}
                                />
                            </View>
                            <TextInput
                                style={[styles.input, styles.marginBottom]}
                                placeholder="Card Holder Name"
                                placeholderTextColor={colors.textMuted}
                                value={cardHolderName}
                                onChangeText={setCardHolderName}
                            />
                        </View>
                        <Text style={[styles.body, styles.textCenter, styles.marginBottom, { color: colors.textSecondary }]}>Please review your details before confirming the payment.</Text>
                        <Pressable style={[styles.button, styles.marginBottom, { backgroundColor: colors.primary }]} onPress={() => setPaymentStep(4)}>
                            <Text style={{ color: 'white', fontWeight: '600' }}>Confirm Payment</Text>
                        </Pressable>
                    </ScrollView>
                ) : paymentStep === 3 ? (
                    <View style={[styles.container, styles.itemsCenter]}>
                        <Text style={[styles.h2, styles.textCenter, styles.marginBottom]}>Cash Payment</Text>
                        <Text style={[styles.body, styles.textCenter, styles.marginBottom, { color: colors.textSecondary }]}>Please prepare the cash amount.</Text>

                        <View style={[styles.card, styles.marginBottom]}>
                            <Text style={[styles.listItemTitle, styles.marginBottom]}>Total Amount: {job.payment.amount} {job.payment.currency}</Text>
                            <Text style={[styles.listItemTitle, styles.marginBottom]}>Amount Due: {job.payment.amountToBePaid} {job.payment.currency}</Text>
                            <Text style={[styles.listItemTitle, styles.marginBottom]}>GST: {job.payment.taxe.gst} ({job.payment.taxe.gstRate}%)</Text>
                            <Text style={[styles.listItemTitle, styles.marginBottom]}>Amount Without Tax: {job.payment.taxe.amountWithoutTax} {job.payment.currency}</Text>
                        </View>

                        {/* Input field for cash amount */}
                        <TextInput
                            style={[styles.input, styles.marginBottom]}
                            placeholder="Enter cash amount"
                            placeholderTextColor={colors.textMuted}
                            keyboardType="numeric"
                            value={cashAmount}
                            onChangeText={setCashAmount}
                        />

                        <Pressable style={[styles.button, styles.marginBottom, { backgroundColor: colors.primary }]} onPress={() => setPaymentStep(4)}>
                            <Text style={{ color: 'white', fontWeight: '600' }}>Confirm Cash Payment</Text>
                        </Pressable>
                    </View>
                ) : (
                    <View style={[styles.containerCentered, { height: '100%' }]}>
                        <Text style={[styles.h1, styles.textCenter, styles.marginBottom]}>Payment Confirmed!</Text>
                        <Text style={[styles.body, styles.textCenter, styles.marginBottom, { color: colors.textSecondary }]}>Thank you for your payment.</Text>
                        <Text style={[styles.body, styles.textCenter, { color: colors.textSecondary }]}>You will receive a confirmation email shortly.</Text>
                    </View>
                )}
            </View>
        </View>
    )
}
export default PaymentWindow;