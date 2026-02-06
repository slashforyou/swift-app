# Business Owner Registration Wizard

Multi-step registration wizard for Business Owner accounts with draft saving, validation, and Australian compliance.

## Features

✅ **8-Step Progressive Registration**

- Personal Information (7 fields)
- Business Details (8 fields with ABN/ACN validation)
- Business Address (5 fields with state picker)
- Banking Information (3 fields with BSB validation)
- Insurance Details (optional, 3 fields)
- Subscription Plan Selection (plan cards with pricing)
- Legal Agreements (3 required checkboxes)
- Review & Submit (summary with edit capability)

✅ **Draft Management**

- Auto-save to AsyncStorage on every change
- Restore draft on app reopen with confirmation dialog
- Clear draft after successful submission
- Exit with save/discard options

✅ **Australian Compliance**

- ABN validation (11-digit checksum algorithm)
- ACN validation (9-digit checksum, optional)
- BSB validation (6-digit bank code)
- Australian phone validation (+61 mobile/landline)
- Australian postcode validation (4 digits, range 0200-9999)
- State picker (NSW, VIC, QLD, SA, WA, TAS, NT, ACT)

✅ **User Experience**

- Progress indicator with visual stepper
- Step-by-step validation with clear error messages
- Auto-formatting (ABN, BSB, phone numbers)
- Helper text for complex fields
- Back/Next navigation with disabled states
- Keyboard-aware scroll views
- Loading states during submission

## File Structure

```
src/
├── screens/
│   └── registration/
│       ├── BusinessOwnerRegistration.tsx  # Main wizard controller
│       └── steps/
│           ├── index.ts                   # Step exports
│           ├── PersonalInfoStep.tsx       # Step 1
│           ├── BusinessDetailsStep.tsx    # Step 2
│           ├── BusinessAddressStep.tsx    # Step 3
│           ├── BankingInfoStep.tsx        # Step 4
│           ├── InsuranceStep.tsx          # Step 5
│           ├── SubscriptionPlanStep.tsx   # Step 6
│           ├── LegalAgreementsStep.tsx    # Step 7
│           └── ReviewStep.tsx             # Step 8
├── components/
│   └── registration/
│       └── ProgressStepper.tsx            # Visual progress indicator
├── utils/
│   └── validators/
│       └── australianValidators.ts        # ABN, ACN, BSB, phone, postcode
├── types/
│   └── registration.ts                    # BusinessOwnerRegistrationData interface
└── localization/
    └── registration-translations-example.ts  # i18n keys reference
```

## Usage

### Basic Integration

```tsx
import { BusinessOwnerRegistration } from "../screens/registration/BusinessOwnerRegistration";

// In your navigation setup:
<Stack.Screen
  name="BusinessOwnerRegistration"
  component={BusinessOwnerRegistration}
  options={{ headerShown: false }}
/>;

// Navigate to wizard:
navigation.navigate("BusinessOwnerRegistration");
```

### Data Flow

1. **Step Components** collect data and validate
2. **Main Wizard** manages state and navigation
3. **AsyncStorage** auto-saves draft on every change
4. **API Submission** on final step (Review)
5. **Navigation** to email verification after success

### Example: Adding to Navigation Stack

```tsx
// In App.tsx or navigation setup:
import BusinessOwnerRegistration from "./src/screens/registration/BusinessOwnerRegistration";

const Stack = createNativeStackNavigator();

<Stack.Navigator>
  <Stack.Screen name="Login" component={LoginScreen} />
  <Stack.Screen name="Register" component={RegisterTypeSelection} />
  <Stack.Screen
    name="BusinessOwnerRegistration"
    component={BusinessOwnerRegistration}
    options={{
      headerShown: false,
      gestureEnabled: false, // Prevent swipe back (use Exit button)
    }}
  />
  <Stack.Screen name="SubscribeMailVerification" component={MailVerification} />
</Stack.Navigator>;
```

## Validators

### ABN Validation

```typescript
import {
  validateABN,
  formatABN,
} from "../utils/validators/australianValidators";

const result = validateABN("51824753556");
// { isValid: true }

const formatted = formatABN("51824753556");
// "51 824 753 556"
```

### BSB Validation

```typescript
import {
  validateBSB,
  formatBSB,
} from "../utils/validators/australianValidators";

const result = validateBSB("062000");
// { isValid: true }

const formatted = formatBSB("062000");
// "062-000"
```

### Phone Validation

```typescript
import {
  validateAustralianPhone,
  formatAustralianPhone,
} from "../utils/validators/australianValidators";

const result = validateAustralianPhone("+61412345678");
// { isValid: true }

const formatted = formatAustralianPhone("+61412345678");
// "+61 412 345 678"
```

## API Integration

### Backend Endpoint (To Implement)

```typescript
// src/services/api/auth.ts
import { BusinessOwnerRegistrationData } from "../../types/registration";

export const registerBusinessOwner = async (
  data: BusinessOwnerRegistrationData,
): Promise<{ id: string; email: string }> => {
  const response = await fetch("/api/auth/register/business-owner", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Registration failed");
  }

  return response.json();
};
```

### Update Wizard to Use API

```tsx
// In BusinessOwnerRegistration.tsx, update handleSubmit:
import { registerBusinessOwner } from "../../services/api/auth";

const handleSubmit = async () => {
  setIsLoading(true);
  try {
    const response = await registerBusinessOwner(formData);

    await clearDraft();

    navigation.navigate("SubscribeMailVerification", {
      id: response.id,
      mail: response.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
    });
  } catch (error) {
    console.error("Registration error:", error);
    Alert.alert(t("common.error"), t("registration.errors.submissionFailed"));
  } finally {
    setIsLoading(false);
  }
};
```

## Translations

Add translations to your localization files (see `registration-translations-example.ts` for complete list):

```typescript
// src/localization/translations/en.ts
export default {
  registration: {
    step: "Step",
    personalInfo: {
      title: "Personal Information",
      subtitle: "Tell us about yourself",
    },
    fields: {
      firstName: "First Name",
      lastName: "Last Name",
      // ... (see example file for complete keys)
    },
    validation: {
      firstNameRequired: "First name is required",
      // ... (see example file)
    },
  },
};
```

## Testing

### Manual Testing Checklist

- [ ] **Step 1**: Enter personal info, validate age 18+, password strength
- [ ] **Step 2**: Enter ABN (try valid/invalid), ACN optional, business type picker
- [ ] **Step 3**: Enter address, state picker, postcode validation
- [ ] **Step 4**: Enter BSB (format XXX-XXX), account number (6-10 digits)
- [ ] **Step 5**: Skip or enter insurance details
- [ ] **Step 6**: Select plan (starter/professional/enterprise), billing frequency
- [ ] **Step 7**: Accept all 3 legal agreements (required)
- [ ] **Step 8**: Review all data, test Edit buttons, submit

### Draft Testing

- [ ] Fill partial form (e.g., steps 1-3)
- [ ] Exit app (kill process)
- [ ] Reopen app, navigate to registration
- [ ] Verify draft restoration dialog appears
- [ ] Test "Continue Draft" → should restore step 3
- [ ] Test "Start Fresh" → should clear and start step 1

### Validation Testing

- [ ] **ABN**: Try `12345678901` (invalid checksum) → error
- [ ] **ABN**: Try `51824753556` (valid) → success
- [ ] **BSB**: Try `123` (too short) → error
- [ ] **BSB**: Try `062000` (valid) → success, formats to `062-000`
- [ ] **Phone**: Try `1234567890` (no +61) → error
- [ ] **Phone**: Try `+61412345678` (valid) → success, formats to `+61 412 345 678`
- [ ] **Postcode**: Try `123` (too short) → error
- [ ] **Postcode**: Try `9999` (valid) → error
- [ ] **Age**: Try DOB `2010-01-01` (under 18) → error

## Customization

### Add New Step

1. Create step component in `src/screens/registration/steps/YourStep.tsx`
2. Follow existing pattern (props: data, onNext, onBack, isLoading)
3. Import in `BusinessOwnerRegistration.tsx`
4. Add to `renderStep()` switch statement
5. Update `steps` array with new step info
6. Update `BusinessOwnerRegistrationData` interface in `types/registration.ts`

### Modify Validation

Edit validators in `src/utils/validators/australianValidators.ts`:

```typescript
export const validateCustomField = (value: string): ValidationResult => {
  if (!value.trim()) {
    return { isValid: false, message: "Field is required" };
  }

  // Your validation logic here

  return { isValid: true };
};
```

### Change Plan Pricing

Edit `SubscriptionPlanStep.tsx`:

```typescript
const plans = [
  {
    value: 'starter',
    name: 'Starter',
    price: '$49',  // Change monthly price
    priceYearly: '$490',  // Change yearly price
    features: [...]
  },
  // ...
];
```

## Dependencies

Required packages (already in project):

- `@react-native-async-storage/async-storage` - Draft persistence
- `@react-native-picker/picker` - Dropdown pickers (business type, state, billing)
- `@react-navigation/native` - Navigation
- `@react-navigation/native-stack` - Stack navigator
- `react-native` - Core framework

## Troubleshooting

### "Cannot read property 'navigate' of undefined"

Ensure navigation prop is passed:

```tsx
<Stack.Screen
  name="BusinessOwnerRegistration"
  component={BusinessOwnerRegistration}
/>
```

### AsyncStorage not saving draft

Check AsyncStorage permissions in `AndroidManifest.xml` (Android) or `Info.plist` (iOS).

### ABN validation failing for valid ABN

Verify ABN format: must be 11 digits, no spaces. Use `formatABN()` to strip formatting before validation.

### Translations not showing

1. Ensure translation keys exist in your localization files
2. Check `useTranslation()` hook is properly configured
3. Import translation keys from example file

## Future Enhancements

- [ ] ABN lookup API integration (validate against ABR)
- [ ] Document upload component (insurance cert, ID verification)
- [ ] Real-time email availability check
- [ ] Password strength meter with visual indicator
- [ ] Autofill business details from ABN lookup
- [ ] Address autocomplete (Google Places API)
- [ ] Plan comparison modal
- [ ] Estimated pricing calculator
- [ ] Multi-language support (7 languages documented)

## License

See LICENSE file in project root.
