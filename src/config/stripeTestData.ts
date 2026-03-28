/**
 * Données de test pour l'onboarding Stripe (DEV uniquement)
 * En production, toutes les fonctions retournent null.
 */

if (!__DEV__) {
  module.exports = {
    generateStripeTestData: () => null,
    getStripeTestData: () => null,
    regenerateStripeTestData: () => null,
  };
}

// Génère un ID court basé sur le timestamp
const getTestId = () => {
  const now = new Date();
  return `${now.getDate()}${now.getHours()}${now.getMinutes()}`;
};

// Génère un numéro de rue aléatoire
const getStreetNumber = () => Math.floor(Math.random() * 500) + 1;

// Liste de rues australiennes
const streets = [
  "George St",
  "Pitt St",
  "Elizabeth St",
  "King St",
  "Market St",
  "Collins St",
  "Bourke St",
  "Flinders St",
];
const getRandomStreet = () =>
  streets[Math.floor(Math.random() * streets.length)];

// Liste de villes australiennes avec état et code postal
const cities = [
  { city: "Sydney", state: "NSW", postalCode: "2000" },
  { city: "Melbourne", state: "VIC", postalCode: "3000" },
  { city: "Brisbane", state: "QLD", postalCode: "4000" },
  { city: "Perth", state: "WA", postalCode: "6000" },
  { city: "Adelaide", state: "SA", postalCode: "5000" },
];
const getRandomCity = () => cities[Math.floor(Math.random() * cities.length)];

/**
 * Génère les données de test pour l'onboarding Stripe
 * Appelé une seule fois au chargement de l'app pour garder la cohérence
 */
export const generateStripeTestData = () => {
  const testId = getTestId();
  const streetNumber = getStreetNumber();
  const street = getRandomStreet();
  const cityInfo = getRandomCity();

  return {
    // Business Profile
    businessProfile: {
      mcc: "7349",
      url: `https://cobbr-test-${testId}.com.au`,
      productDescription: `Cleaning services - Test ${testId}`,
    },

    // Company Details
    company: {
      name: `Cobbr Test ${testId} Pty Ltd`,
      taxId: `${50000000000 + parseInt(testId)}`, // ABN format
      companyNumber: `${100000000 + parseInt(testId)}`, // ACN format
      phone: `02${Math.floor(10000000 + Math.random() * 90000000)}`,
      address: {
        line1: `${streetNumber} ${street}`,
        line2: `Suite ${Math.floor(Math.random() * 50) + 1}`,
        city: cityInfo.city,
        state: cityInfo.state,
        postalCode: cityInfo.postalCode,
      },
    },

    // Representative (Owner/Director)
    representative: {
      firstName: "Test",
      lastName: `User${testId}`,
      email: `test${testId}@cobbr.dev`,
      phone: `04${Math.floor(10000000 + Math.random() * 90000000)}`,
      dob: new Date(
        1990,
        Math.floor(Math.random() * 12),
        Math.floor(Math.random() * 28) + 1,
      ),
      address: {
        line1: `${streetNumber + 10} ${street}`,
        line2: `Unit ${Math.floor(Math.random() * 20) + 1}`,
        city: cityInfo.city,
        state: cityInfo.state,
        postalCode: cityInfo.postalCode,
      },
      title: "Director",
      owner: true,
      director: true,
      executive: true,
      percentOwnership: "100",
    },

    // Personal Address (Individual)
    address: {
      line1: `${streetNumber} ${street}`,
      line2: `Apt ${Math.floor(Math.random() * 100) + 1}`,
      city: cityInfo.city,
      state: cityInfo.state,
      postalCode: cityInfo.postalCode,
    },

    // Bank Account (Stripe test bank)
    bankAccount: {
      accountHolderName: `Test User ${testId}`,
      bsb: "000-000", // Stripe test BSB
      accountNumber: "000123456", // Stripe test account
    },

    // Personal Info (Individual)
    personalInfo: {
      firstName: "Test",
      lastName: `User${testId}`,
      email: `test${testId}@cobbr.dev`,
      phone: `04${Math.floor(10000000 + Math.random() * 90000000)}`,
      dob: new Date(
        1990,
        Math.floor(Math.random() * 12),
        Math.floor(Math.random() * 28) + 1,
      ),
    },

    // Metadata
    testId,
    generatedAt: new Date().toISOString(),
  };
};

// Singleton pour garder les mêmes données pendant la session
let _testData: ReturnType<typeof generateStripeTestData> | null = null;

export const getStripeTestData = () => {
  if (!_testData) {
    _testData = generateStripeTestData();
    console.log(
      `🧪 [TEST DATA] Generated test data with ID: ${_testData.testId}`,
    );
  }
  return _testData;
};

// Régénère les données (pour les tests)
export const regenerateStripeTestData = () => {
  _testData = generateStripeTestData();
  console.log(
    `🔄 [TEST DATA] Regenerated test data with ID: ${_testData.testId}`,
  );
  return _testData;
};
