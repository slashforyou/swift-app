/**
 * Types pour le système de traduction
 * Architecture scalable et type-safe
 */

export type SupportedLanguage =
  | "en" // English (default)
  | "fr" // Français
  | "pt" // Português
  | "es" // Español
  | "it" // Italiano
  | "zh" // 中文 (Chinese)
  | "hi"; // हिन्दी (Hindi)

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  rtl?: boolean; // Pour les langues Right-to-Left futures
}

export interface TranslationKeys {
  // Job Steps - Centralized step configuration
  jobSteps: {
    notStarted: string;
    notStartedShort: string;
    notStartedDesc: string;
    // Trajet vers adresse
    travelToAddress: string;
    travelToAddressShort: string;
    travelToAddressDesc: string;
    // Travail à l'adresse
    atAddress: string;
    atAddressShort: string;
    atAddressDesc: string;
    // Trajet retour
    travelReturn: string;
    travelReturnShort: string;
    travelReturnDesc: string;
    // Arrivée/Fin
    arrivalEnd: string;
    arrivalEndShort: string;
    arrivalEndDesc: string;
    // Utilitaires
    skipReturn: string;
    skipReturnDesc: string;
    payment: string;
    paymentDesc: string;
    address: string;
  };
  // Common
  common: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    add: string;
    search: string;
    loading: string;
    error: string;
    success: string;
    warning: string;
    info: string;
    yes: string;
    no: string;
    ok: string;
    close: string;
    back: string;
    next: string;
    previous: string;
    done: string;
    continue: string;
    skip: string;
    retry: string;
    confirm: string;
    refresh: string;
    settings: string;
    language: string;
    noSelection: string;
    optional: string;
  };

  // Home Screen
  home: {
    title: string;
    welcome: string;
    today: {
      title: string;
      loading: string;
      noJobs: string;
      allCompleted: string;
      pending: string;
      totalJobs: string;
      completed: string;
    };
    calendar: {
      title: string;
      description: string;
    };
    business: {
      title: string;
      description: string;
    };
    jobs: {
      title: string;
      description: string;
    };
    profile: {
      title: string;
      description: string;
    };
    parameters: {
      title: string;
      description: string;
    };
    connection: {
      title: string;
      description: string;
      testConnection: string;
      status: {
        connected: string;
        disconnected: string;
        testing: string;
      };
    };
    leaderboard: {
      title: string;
      description: string;
    };
  };

  // Navigation
  navigation: {
    home: string;
    calendar: string;
    jobs: string;
    profile: string;
    settings: string;
  };

  // Job Management
  jobs: {
    title: string;
    editJob: string;
    statusLabel: string;
    createNewJob: string;
    createJob: string;
    createSuccess: string;
    createSuccessAddAnother: string;
    createError: string;
    createAndAddAnother: string;
    selectClient: string;
    selectClientDescription: string;
    enterAddresses: string;
    enterAddressesDescription: string;
    schedule: string;
    scheduleDescription: string;
    selectStaff: string;
    assignStaff: string;
    assignedStaff: string;
    vehicleType: string;
    extras: string;
    detailsDescription: string;
    confirmation: string;
    confirmationDescription: string;
    client: string;
    priority: string;
    notes: string;
    notesPlaceholder: string;
    startTime: string;
    endTime: string;
    // Payment translations
    payment: string;
    quoteAmount: string;
    paymentMethod: string;
    depositRequired: string;
    depositPercentage: string;
    depositAmount: string;
    depositPaid: string;
    paymentSummary: string;
    // Pricing translations
    pricing: string;
    pricingDescription: string;
    pricingConfig: string;
    pricingSummary: string;
    hourlyRate: string;
    callOutFee: string;
    minimumCharge: string;
    rounding: string;
    depotToDepot: string;
    depotToDepotLabel: string;
    depotToDepotActiveDesc: string;
    depotToDepotInactiveDesc: string;
    timeRounding: string;
    estimatedDuration: string;
    status: {
      pending: string;
      inProgress: string;
      completed: string;
      cancelled: string;
    };
    timer: {
      start: string;
      stop: string;
      pause: string;
      resume: string;
      break: string;
      endBreak: string;
      totalTime: string;
      billableTime: string;
      breakTime: string;
      currentStep: string;
      nextStep: string;
      previousStep: string;
      completeStep: string;
      finish: string;
    };
    details: {
      information: string;
      items: string;
      contacts: string;
      timeline: string;
      payment: string;
      summary: string;
    };
  };

  // Address
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    selectState: string;
  };

  // Calendar
  calendar: {
    title: string;
    // Days of the week
    days: {
      mon: string;
      tue: string;
      wed: string;
      thu: string;
      fri: string;
      sat: string;
      sun: string;
    };
    // Months
    months: {
      january: string;
      february: string;
      march: string;
      april: string;
      may: string;
      june: string;
      july: string;
      august: string;
      september: string;
      october: string;
      november: string;
      december: string;
    };
    // Stats
    stats: {
      totalJobs: string;
      urgent: string;
      completed: string;
    };
    // Actions
    refresh: string;
    goToDay: string;
    previousMonth: string;
    nextMonth: string;
    // Filters and sorting
    filters: {
      all: string;
      pending: string;
      active: string;
      done: string;
    };
    sorting: {
      time: string;
      priority: string;
      status: string;
    };
    // Navigation
    previousDay: string;
    nextDay: string;
    // Year view
    currentYear: string;
    years: string;
    selectFromRange: string;
    // States
    loading: string;
    noJobsScheduled: string;
    freeDay: string;
    enjoyTimeOff: string;
    somethingWentWrong: string;
    tryAgain: string;
    // Job status and priority
    jobStatus: {
      pending: string;
      inProgress: string;
      completed: string;
      cancelled: string;
      unknown: string;
    };
    priority: {
      urgent: string;
      high: string;
      medium: string;
      low: string;
      normal: string;
    };
    // Client
    unknownClient: string;
    // Navigation
    navigation: {
      monthlyView: string;
      yearlyView: string;
      multiYearView: string;
      dailyView: string;
      loadingCalendar: string;
      authenticationError: string;
      goToLogin: string;
      loading: string;
    };
    // Day Screen specific
    dayScreen: {
      stats: {
        total: string;
        pending: string;
        completed: string;
      };
      filtersTitle: string;
      sortBy: string;
      details: string;
      noVehicleSelected: string;
      noPickupAddress: string;
      noDeliveryAddress: string;
      notAvailable: string;
    };
    selectMonth: string;
  };

  // Clients
  clients: {
    noClients: string;
    searchPlaceholder: string;
    addClient: string;
    addClientDescription: string;
    createClient: string;
    firstName: string;
    firstNamePlaceholder: string;
    lastName: string;
    lastNamePlaceholder: string;
    email: string;
    emailPlaceholder: string;
    phone: string;
    phonePlaceholder: string;
    company: string;
    companyPlaceholder: string;
    validation: {
      nameRequired: string;
      emailRequired: string;
      phoneRequired: string;
    };
    success: {
      created: string;
      clientCreated: string;
    };
    error: {
      createFailed: string;
    };
  };

  // Profile
  profile: {
    title: string;
    personalInfo: string;
    preferences: string;
    logout: string;
    version: string;
    level: string;
    experience: string;
    toNextLevel: string;
    defaultTitle: string;
    loading: string;
    updateSuccess: string;
    updateError: string;
    genericError: string;
    retry: string;
    cancel: string;
    save: string;
    saving: string;
    edit: string;
    ranks: {
      master: string;
      expert: string;
      senior: string;
      driver: string;
      rookie: string;
    };
    fields: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      address: string;
      city: string;
      postalCode: string;
      country: string;
    };
    actions: {
      edit: string;
      save: string;
      cancel: string;
      changePassword: string;
      changeEmail: string;
      chooseAvatar: string;
    };
    messages: {
      updateSuccess: string;
      updateError: string;
      passwordChanged: string;
      passwordChangeError: string;
      emailChanged: string;
      emailChangeError: string;
      avatarUpdated: string;
    };
    security: {
      title: string;
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
      passwordMismatch: string;
      passwordTooShort: string;
    };
    avatar: {
      title: string;
      selectAvatar: string;
    };
    photo: {
      title: string;
      uploadComingSoon: string;
    };
    placeholders: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      address: string;
      city: string;
      postalCode: string;
      country: string;
      companyName: string;
      siret: string;
      vat: string;
    };
  };

  // Job Details
  jobDetails: {
    panels: {
      summary: string;
      jobDetails: string;
      clientInfo: string;
      notes: string;
      payment: string;
    };
    errors: {
      invalidJobId: string;
      cannotLoadDetails: string;
      loadingError: string;
    };
    steps: {
      pickup: string;
      intermediate: string;
      dropoff: string;
      pickupDescription: string;
      intermediateDescription: string;
      dropoffDescription: string;
    };
    client: {
      firstTimeClient: string;
      // Client screen labels
      title: string;
      subtitle: string;
      loading: string;
      name: string;
      firstName: string;
      lastName: string;
      phone: string;
      email: string;
      company: string;
      address: string;
      notes: string;
      notSpecified: string;
      unknown: string;
      noPhone: string;
      noEmail: string;
      quickActions: string;
      call: string;
      sms: string;
      emailAction: string;
    };
    // Job page labels
    job: {
      jobItems: string;
      noItems: string;
      addItem: string;
      addItemTitle: string;
      itemName: string;
      itemNamePlaceholder: string;
      quantity: string;
      cancel: string;
      adding: string;
      completed: string;
      local: string;
      sync: string;
      jobInformation: string;
      jobType: string;
      numberOfItems: string;
      status: string;
      contractor: string;
      contractee: string;
      companyName: string;
      contactPerson: string;
      error: string;
      errorItemName: string;
      errorQuantity: string;
      success: string;
      itemAdded: string;
      itemAddedLocally: string;
      itemAddedLocallyMessage: string;
      crewAssigned: string;
      teamMember: string;
      noCrew: string;
    };
    // Notes page labels
    notes: {
      title: string;
      loading: string;
      add: string;
      addFirstNote: string;
      noNotes: string;
      noNotesDescription: string;
      count: string;
      countPlural: string;
      localSyncInfo: string;
      types: {
        general: string;
        important: string;
        client: string;
        internal: string;
      };
      typeDescriptions: {
        general: string;
        important: string;
        client: string;
        internal: string;
      };
      time: {
        justNow: string;
        hoursAgo: string;
        yesterday: string;
        recently: string;
      };
      modal: {
        title: string;
        subtitle: string;
        typeLabel: string;
        titleLabel: string;
        titleOptional: string;
        contentLabel: string;
        titlePlaceholder: string;
        contentPlaceholder: string;
        cancel: string;
        submit: string;
        submitting: string;
        emptyContentError: string;
      };
    };
    defaultNote: string;
    messages: {
      noteAdded: string;
      noteAddedSuccess: string;
      noteAddError: string;
      noteAddErrorMessage: string;
      photoAdded: string;
      photoAddedSuccess: string;
      photoAddError: string;
      photoAddErrorMessage: string;
      photoDescription: string;
      nextStep: string;
      advancedToStep: string;
      syncError: string;
      syncErrorMessage: string;
      stepUpdateError: string;
      stepUpdateErrorMessage: string;
      signatureSaved: string;
      signatureSaveError: string;
      signatureSaveErrorMessage: string;
    };
    // Payment page labels
    payment: {
      title: string;
      // Status
      status: {
        pending: string;
        partial: string;
        completed: string;
      };
      // Job status
      jobStatus: {
        completed: string;
        inProgress: string;
      };
      // Alerts
      alerts: {
        jobInProgress: string;
        jobInProgressMessage: string;
        signatureRequired: string;
        signatureRequiredMessage: string;
        cancel: string;
        signNow: string;
        alreadyProcessed: string;
        alreadyProcessedMessage: string;
      };
      // Signature section
      signature: {
        verifying: string;
        signJob: string;
        payNow: string;
        jobSignedByClient: string;
      };
      // Live tracking section
      liveTracking: {
        title: string;
        live: string;
        totalTimeElapsed: string;
        billableTime: string;
        currentCost: string;
      };
      // Financial summary section
      financialSummary: {
        title: string;
        estimatedCost: string;
        finalCost: string;
        currentCost: string;
        additionalCost: string;
        savings: string;
      };
      // Billing breakdown section
      billingBreakdown: {
        title: string;
        actualWorkTime: string;
        pausesNotBillable: string;
        grossBillableTime: string;
        minimumBillable: string;
        minimumPolicy: string;
        callOutFee: string;
        travelFee: string;
        halfHourRounding: string;
        sevenMinuteRule: string;
        auto: string;
        totalBillableHours: string;
        hourlyRate: string;
        finalAmount: string;
        explanatoryNote: string;
      };
      // Additional items section
      additionalItems: {
        title: string;
        noItems: string;
        addItem: string;
        addItemTitle: string;
        description: string;
        descriptionPlaceholder: string;
        amount: string;
        subtotal: string;
        descriptionRequired: string;
        validAmountRequired: string;
      };
      // Job details section
      jobDetailsSection: {
        title: string;
        billingDetails: string;
        billableHours: string;
        hourlyRate: string;
        jobTitle: string;
        client: string;
        estimatedDuration: string;
        untitledJob: string;
        notDefined: string;
        hours: string;
      };
    };
    // JobDetails components
    components: {
      stepValidation: {
        inconsistencyDetected: string;
        suggestion: string;
        stepCorrected: string;
        correctionError: string;
        autoCorrectionFailed: string;
        autoCorrect: string;
      };
      truckDetails: {
        title: string;
        subtitle: string;
        primaryVehicle: string;
        licensePlate: string;
        noVehicleAssigned: string;
        noVehicleDescription: string;
        addVehicleButton: string;
        assignVehicle: string;
        selectVehicle: string;
        noVehiclesAvailable: string;
        addNewVehicle: string;
        assignSelected: string;
        removeVehicle: string;
        currentVehicle: string;
        loadError: string;
        assignSuccess: string;
        assignError: string;
        removeConfirmTitle: string;
        removeConfirmMessage: string;
        removeSuccess: string;
        removeError: string;
      };
      timeWindows: {
        title: string;
        subtitle: string;
        missionStart: string;
      };
      jobProgress: {
        percentComplete: string;
        detailedTracking: string;
      };
      jobTime: {
        chronoWillStart: string;
        inProgress: string;
        finished: string;
        currentStep: string;
        stepDetails: string;
        costCalculation: string;
        timeTracking: string;
        total: string;
        billable: string;
        onBreak: string;
        resumeWork: string;
        takeBreak: string;
        totalTime: string;
        breakTime: string;
        billableTime: string;
      };
      quickActions: {
        startJob: string;
        arrivedAtClient: string;
        jobFinished: string;
        advanceStep: string;
        goToStep: string;
        stepActivated: string;
        jobAlreadyFinished: string;
        noPhoneAvailable: string;
        noteAdded: string;
        error: string;
        success: string;
        information: string;
        quickNote: string;
        addNoteToJob: string;
      };
      signature: {
        verifying: string;
        contractSigned: string;
        clientValidated: string;
        contractMustBeSigned: string;
        // Signing modal
        title: string;
        subtitle: string;
        contractTitle: string;
        digitalSignature: string;
        ready: string;
        initializing: string;
        signingInProgress: string;
        clear: string;
        save: string;
        saving: string;
        cancel: string;
        emptySignature: string;
        emptySignatureMessage: string;
        signatureUpdated: string;
        signatureUpdatedMessage: string;
        signatureSaved: string;
        signatureSavedMessage: string;
        serverError: string;
        serverErrorMessage: string;
        saveError: string;
        saveErrorMessage: string;
        ok: string;
        perfect: string;
      };
      photos: {
        title: string;
        deleteConfirm: string;
        deleteTitle: string;
        cancel: string;
        delete: string;
        save: string;
        added: string;
        addedSuccess: string;
        descriptionUpdated: string;
        updateError: string;
        deleted: string;
        error: string;
        success: string;
        noDescription: string;
        withoutDescription: string;
        nonImageFile: string;
        loadError: string;
        loading: string;
        loadingPhotos: string;
        takePhotoError: string;
        selectPhotoError: string;
        permissionRequired: string;
        permissionRequiredMessage: string;
        cameraPermissionMessage: string;
        selectionModal: {
          title: string;
          subtitle: string;
          takePhoto: string;
          takePhotoDescription: string;
          selectFromGallery: string;
          selectFromGalleryDescription: string;
        };
        stages: {
          pickup: string;
          delivery: string;
          other: string;
          before: string;
          after: string;
        };
        time: {
          minutesAgo: string;
          hoursAgo: string;
          daysAgo: string;
        };
      };
      jobClock: {
        jobInProgress: string;
        jobFinished: string;
        stepNumber: string;
        onPause: string;
        totalElapsedTime: string;
        signatureRequired: string;
        signatureRequiredMessage: string;
        signNow: string;
        finishJob: string;
        finishJobConfirm: string;
        finish: string;
        nextStep: string;
        signatureModalUnavailable: string;
        cancel: string;
        error: string;
        confirm: string;
        goToStep: string;
      };
      jobTimeline: {
        noJobData: string;
        stepOf: string;
        currentStep: string;
        hideDetails: string;
        showDetails: string;
        startedAt: string;
        endedAt: string;
        duration: string;
        notStarted: string;
        inProgress: string;
        status: {
          pending: string;
          inProgress: string;
          completed: string;
          cancelled: string;
          unknown: string;
        };
        statusDescription: {
          pending: string;
          inProgress: string;
          completed: string;
          cancelled: string;
          unknown: string;
        };
      };
      stepAdvanceModal: {
        title: string;
        subtitle: string;
        stepProgress: string;
        stepUpdated: string;
        stepUpdatedMessage: string;
        syncError: string;
        syncErrorMessage: string;
        statusCompleted: string;
        statusCurrent: string;
        statusPending: string;
        noDescription: string;
        advancing: string;
        advance: string;
        close: string;
        updating: string;
      };
    };
  };

  // Settings
  settings: {
    title: string;
    language: {
      title: string;
      description: string;
      current: string;
      select: string;
    };
    theme: {
      title: string;
      light: string;
      dark: string;
      auto: string;
    };
    notifications: {
      title: string;
      enabled: string;
      disabled: string;
    };
    // Phase 3.1: Added settings sections, items, alerts
    sections: {
      notifications: string;
      preferences: string;
      privacy: string;
      security: string;
      appearance: string;
      data: string;
      account: string;
    };
    items: {
      pushNotifications: string;
      pushDescription: string;
      emailNotifications: string;
      emailDescription: string;
      smsNotifications: string;
      smsDescription: string;
      taskReminders: string;
      taskRemindersDescription: string;
      soundEnabled: string;
      soundDescription: string;
      biometricEnabled: string;
      biometricDescription: string;
      darkMode: string;
      darkModeDescription: string;
      autoSync: string;
      autoSyncDescription: string;
      offlineMode: string;
      offlineModeDescription: string;
      shareLocation: string;
      shareLocationDescription: string;
      analytics: string;
      analyticsDescription: string;
      logout: string;
      logoutDescription: string;
      businessInfo: string;
      businessInfoDescription: string;
      paymentSettings: string;
      paymentSettingsDescription: string;
      rolesPermissions: string;
      rolesPermissionsDescription: string;
      teamsManagement: string;
      teamsManagementDescription: string;
    };
    alerts: {
      biometricEnabled: {
        title: string;
        message: string;
      };
      resetSettings: {
        title: string;
        message: string;
        cancel: string;
        confirm: string;
      };
      resetSuccess: {
        title: string;
        message: string;
      };
      logout: {
        title: string;
        message: string;
        cancel: string;
        confirm: string;
        error: string;
      };
    };
    actions: {
      resetSettings: string;
      logout: string;
    };
  };

  // Business Management
  business: {
    navigation: {
      loadingBusiness: string;
      authenticationError: string;
      goToLogin: string;
      businessInfo: string;
      staffCrew: string;
      trucks: string;
      jobsBilling: string;
    };
    info: {
      title: string;
      placeholder: string;
      noDataAvailable: string;
      // Sections
      statisticsOverview: string;
      companyInformation: string;
      contactDetails: string;
      businessAddress: string;
      // Stats
      totalVehicles: string;
      activeJobs: string;
      completedJobs: string;
      // Company fields
      companyName: string;
      abn: string;
      establishedDate: string;
      businessType: string;
      notSpecified: string;
      movingServices: string;
      // Contact fields
      phone: string;
      email: string;
      website: string;
      // Address fields
      streetAddress: string;
      city: string;
      state: string;
      postcode: string;
    };
    staff: {
      title: string;
      placeholder: string;
    };
    trucks: {
      title: string;
      placeholder: string;
    };
    jobs: {
      title: string;
      placeholder: string;
    };
  };

  // Payment
  payment: {
    missingInfo: {
      title: string;
      message: string;
    };
    errors: {
      jobIdNotFound: string;
      paymentError: string;
      generic: string;
      processingFailed: string;
      networkError: string;
    };
    buttons: {
      processing: string;
      confirm: string;
      retry: string;
      continue: string;
      download: string;
      email: string;
      backToDashboard: string;
    };
    status: {
      processing: string;
      success: string;
      failed: string;
    };
    success: {
      title: string;
      subtitle: string;
      amount: string;
      paymentId: string;
      description: string;
      jobId: string;
      dateTime: string;
    };
    // PaymentWindow specific keys
    window: {
      chooseMethod: string;
      amountToPay: string;
      paymentError: string;
      paymentIntentCreated: string;
      securePayment: string;
      secureCardPayment: string;
      cashPayment: string;
      cashPaymentTitle: string;
      processingPayment: string;
      paymentSuccess: string;
      paymentSuccessMessage: string;
      cashCollected: string;
      changeToReturn: string;
      amountReceived: string;
      enterAmountReceived: string;
      minimumAmount: string;
      toPay: string;
      returnToPaymentMethod: string;
      close: string;
      cardManualTitle: string;
      cardInfo: string;
      incorrectAmount: string;
      incorrectAmountMessage: string;
      paymentSheetUnavailable: string;
      paymentSheetFallbackMessage: string;
      cardNamePlaceholder: string;
    };
    stripeConnect: {
      title: string;
      loading: string;
      connectionError: string;
      loadError: string;
      canceledOrError: string;
      retry: string;
    };
    stripeOnboarding: {
      onboardingInterrupted: string;
      loadError: string;
      loading: string;
      retry: string;
      close: string;
    };
  };

  // Vehicles
  vehicles: {
    fleet: string;
    addVehicle: string;
    adding: string;
    totalVehicles: string;
    available: string;
    inUse: string;
    maintenance: string;
    outOfService: string;
    all: string;
    loading: string;
    year: string;
    capacity: string;
    nextService: string;
    noVehicles: string;
    noFilteredVehicles: string;
    details: string;
    registration: string;
    make: string;
    model: string;
    location: string;
    assignedTo: string;
    notFound: string;
    loadingDetails: string;
    quickActions: string;
    changeStatus: string;
    scheduleService: string;
    assignStaff: string;
    selectNewStatus: string;
    featureComingSoon: string;
    maintenanceHistory: string;
    deleteTitle: string;
    updateSuccess: string;
    updateError: string;
    types: {
      movingTruck: string;
      van: string;
      trailer: string;
      ute: string;
      dolly: string;
      tools: string;
      vehicle: string;
    };
    actions: {
      edit: string;
      delete: string;
      cancel: string;
      remove: string;
    };
    alerts: {
      addSuccess: {
        title: string;
        message: string;
      };
      addError: {
        title: string;
        message: string;
      };
      deleteConfirm: {
        message: string;
      };
      deleteSuccess: {
        title: string;
        message: string;
      };
      deleteError: {
        title: string;
        message: string;
      };
      editConfirm: {
        message: string;
      };
    };
    validation: {
      error: string;
      selectMake: string;
      enterModel: string;
      yearRange: string;
      enterRegistration: string;
      invalidRegistration: string;
      selectLocation: string;
      enterNextService: string;
      serviceDatePast: string;
    };
    addModal: {
      title: string;
      vehicleType: string;
      selectTypeSubtitle: string;
      vehicleDetails: string;
      detailsSubtitle: string;
      make: string;
      model: string;
      year: string;
      registration: string;
      capacity: string;
      location: string;
      nextService: string;
      dateHelperText: string;
      addButton: string;
      vehicleAdded: string;
      vehicleAddedMessage: string;
    };
    errors: {
      loadingTitle: string;
      loadingMessage: string;
    };
  };

  // Staff Management
  staff: {
    titles: {
      main: string;
      subtitle: string;
      loading: string;
    };
    stats: {
      active: string;
      employees: string;
      contractors: string;
      averageRate: string;
    };
    actions: {
      add: string;
      edit: string;
      remove: string;
      cancel: string;
    };
    filters: {
      all: string;
      employees: string;
      contractors: string;
    };
    types: {
      employee: string;
      contractor: string;
    };
    status: {
      active: string;
      inactive: string;
      pending: string;
    };
    alerts: {
      removeConfirm: {
        title: string;
        message: string;
      };
      removeSuccess: {
        title: string;
        message: string;
      };
      removeError: {
        title: string;
        message: string;
      };
    };
    empty: {
      title: string;
      subtitle: string;
    };
    noStaffAvailable: string;
  };

  // Errors and Messages
  messages: {
    errors: {
      network: string;
      generic: string;
      notFound: string;
      unauthorized: string;
      serverError: string;
      validation: string;
    };
    success: {
      saved: string;
      deleted: string;
      updated: string;
      created: string;
    };
  };

  // Authentication
  auth: {
    login: {
      title: string;
      subtitle: string;
      email: string;
      emailPlaceholder: string;
      password: string;
      passwordPlaceholder: string;
      submit: string;
      submitting: string;
      createAccount: string;
      back: string;
      forgotPassword: string;
    };
    register: {
      title: string;
      subtitle: string;
      firstName: string;
      firstNamePlaceholder: string;
      lastName: string;
      lastNamePlaceholder: string;
      email: string;
      emailPlaceholder: string;
      password: string;
      passwordPlaceholder: string;
      confirmPassword: string;
      confirmPasswordPlaceholder: string;
      phone: string;
      phonePlaceholder: string;
      submit: string;
      submitting: string;
      alreadyHaveAccount: string;
      termsAgree: string;
      termsLink: string;
    };
    validation: {
      emailRequired: string;
      emailInvalid: string;
      passwordRequired: string;
      passwordTooShort: string;
      passwordMismatch: string;
      firstNameRequired: string;
      lastNameRequired: string;
    };
    errors: {
      invalidCredentials: string;
      deviceInfoUnavailable: string;
      serverError: string;
      invalidResponse: string;
      networkError: string;
      timeout: string;
      generic: string;
      // Enhanced error titles
      loginFailed: string;
      authenticationError: string;
      deviceError: string;
      serverConnectionError: string;
      connectionError: string;
    };
    success: {
      loginSuccess: string;
      registerSuccess: string;
      welcome: string;
    };
    emailVerification: {
      title: string;
      subtitle: string;
      codePlaceholder: string;
      verify: string;
      verifying: string;
      resendCode: string;
      codeRequired: string;
      codeInvalidFormat: string;
      emailMissing: string;
      emailInvalid: string;
      verificationSuccess: string;
      verificationFailed: string;
      codeIncorrect: string;
      codeExpired: string;
      codeInvalid: string;
      serverError: string;
      networkError: string;
      timeoutError: string;
      backToRegister: string;
      checkEmail: string;
      sentCodeTo: string;
      enterCode: string;
      didNotReceive: string;
      checkSpam: string;
      restartRegistration: string;
    };
    connection: {
      title: string;
      subtitle: string;
      loginButton: string;
      registerButton: string;
      or: string;
      features: {
        planning: string;
        realtime: string;
        management: string;
      };
    };
  };

  // Stripe & Payments
  stripe: {
    hub: {
      title: string;
      subtitle: string;
      balance: string;
      availableBalance: string;
      pendingBalance: string;
      recentPayments: string;
      viewAll: string;
      noPayments: string;
      accountStatus: string;
      onboarding: string;
      completeSetup: string;
      checkingConnection: string;
      connectionError: string;
      // Account Status
      accountVerified: string;
      actionRequired: string;
      pending: string;
      incomplete: string;
      // Requirements
      missingInfo: string;
      urgentAction: string;
      completeProfile: string;
      additionalParams: string;
      // Errors
      errorLoadingForm: string;
    };
    onboarding: {
      welcome: {
        title: string;
        subtitle: string;
        timeEstimate: string;
        benefit1: string;
        benefit2: string;
        benefit3: string;
        benefit4: string;
        whatYouNeedTitle: string;
        requirement1: string;
        requirement2: string;
        requirement3: string;
        startButton: string;
        cancelButton: string;
      };
      personalInfo: {
        step: string;
        title: string;
        subtitle: string;
        firstName: string;
        firstNamePlaceholder: string;
        lastName: string;
        lastNamePlaceholder: string;
        dob: string;
        dobPlaceholder: string;
        dobHelper: string;
        email: string;
        emailPlaceholder: string;
        phone: string;
        phonePlaceholder: string;
        phoneHelper: string;
        requiredNote: string;
        nextButton: string;
        errors: {
          firstNameRequired: string;
          lastNameRequired: string;
          dobRequired: string;
          dobMinAge: string;
          emailRequired: string;
          emailInvalid: string;
          phoneRequired: string;
          phoneInvalid: string;
          validationTitle: string;
          validationMessage: string;
        };
      };
      address: {
        step: string;
        title: string;
        subtitle: string;
        line1: string;
        line1Placeholder: string;
        line2: string;
        line2Placeholder: string;
        line2Helper: string;
        city: string;
        cityPlaceholder: string;
        state: string;
        statePlaceholder: string;
        postalCode: string;
        postalCodePlaceholder: string;
        statesAvailable: string;
        nextButton: string;
        errors: {
          line1Required: string;
          cityRequired: string;
          stateRequired: string;
          postalCodeRequired: string;
          postalCodeInvalid: string;
          validationTitle: string;
          validationMessage: string;
        };
      };
      bankAccount: {
        step: string;
        title: string;
        subtitle: string;
        holderName: string;
        holderNamePlaceholder: string;
        bsb: string;
        bsbPlaceholder: string;
        bsbHelper: string;
        accountNumber: string;
        accountNumberPlaceholder: string;
        accountNumberHelper: string;
        securityNote: string;
        infoNote: string;
        nextButton: string;
        errors: {
          holderNameRequired: string;
          bsbRequired: string;
          bsbInvalid: string;
          accountNumberRequired: string;
          accountNumberInvalid: string;
          validationTitle: string;
          validationMessage: string;
        };
      };
      documents: {
        step: string;
        title: string;
        subtitle: string;
        checklistTitle: string;
        checklist1: string;
        checklist2: string;
        frontTitle: string;
        frontPlaceholder: string;
        backTitle: string;
        backPlaceholder: string;
        takePhotoButton: string;
        retakeButton: string;
        nextButton: string;
        errors: {
          permissionTitle: string;
          permissionMessage: string;
          captureTitle: string;
          captureMessage: string;
          validationTitle: string;
          validationMessage: string;
        };
      };
      review: {
        step: string;
        title: string;
        subtitle: string;
        personalInfoTitle: string;
        addressTitle: string;
        bankAccountTitle: string;
        documentsTitle: string;
        editButton: string;
        name: string;
        dob: string;
        email: string;
        phone: string;
        accountHolder: string;
        bsb: string;
        accountNumber: string;
        frontUploaded: string;
        backUploaded: string;
        tosText: string;
        tosLink: string;
        tosTextEnd: string;
        disclaimer: string;
        activateButton: string;
        successTitle: string;
        successMessage: string;
        errors: {
          tosTitle: string;
          tosMessage: string;
        };
      };
    };
    settings: {
      title: string;
      subtitle: string;
      accountInfo: string;
      payoutSchedule: string;
      bankAccount: string;
      updateAccount: string;
      // Sections
      sections: {
        accountSetup: string;
        paymentSettings: string;
        developerSettings: string;
        dangerZone: string;
      };
      // Account labels
      country: string;
      currency: string;
      liveMode: string;
      testMode: string;
      loading: string;
      noAccountData: string;
      // Account Setup items
      completeSetup: string;
      completeSetupDesc: string;
      testIntegration: string;
      testIntegrationDesc: string;
      // Payment Settings items
      instantPayouts: string;
      instantPayoutsDesc: string;
      emailReceipts: string;
      emailReceiptsDesc: string;
      smsNotifications: string;
      smsNotificationsDesc: string;
      // Developer Settings items
      webhooks: string;
      webhooksDesc: string;
      webhookConfig: string;
      webhookConfigDesc: string;
      // Danger Zone items
      disconnectAccount: string;
      disconnectAccountDesc: string;
      // Alerts
      alerts: {
        setupTitle: string;
        setupMessage: string;
        webhookTitle: string;
        webhookMessage: string;
        testPaymentTitle: string;
        testPaymentMessage: string;
        disconnectTitle: string;
        disconnectMessage: string;
        errorUpdate: string;
        createTestPayment: string;
      };
    };
    payments: {
      title: string;
      filterAll: string;
      filterPending: string;
      filterCompleted: string;
      filterFailed: string;
      filterSucceeded: string;
      filterProcessing: string;
      noPayments: string;
      noPaymentsYet: string;
      noPaymentsFound: string;
      amount: string;
      date: string;
      status: string;
      searchPlaceholder: string;
      anonymous: string;
      creditCard: string;
      bankTransfer: string;
      hourlyRate: string;
      totalAmount: string;
      subtotal: string;
      tax: string;
      discount: string;
    };
    payouts: {
      title: string;
      subtitle: string;
      requestPayout: string;
      noPayouts: string;
      noPayoutsFound: string;
      processing: string;
      completed: string;
      failed: string;
      pending: string;
      inTransit: string;
      filterAll: string;
      filterPending: string;
      filterCompleted: string;
      bankAccount: string;
      created: string;
      arrival: string;
      feesIncluded: string;
      instantModal: {
        error: string;
        invalidAmount: string;
        amountExceedsMax: string;
        processingError: string;
        title: string;
        maxAvailable: string;
        amountLabel: string;
        amountPlaceholder: string;
        descriptionLabel: string;
        descriptionPlaceholder: string;
        feesWarning: string;
        feesDetails: string;
        cancel: string;
        confirm: string;
        processing: string;
      };
    };
    status: {
      connected: string;
      pending: string;
      restricted: string;
      notConnected: string;
    };
  };

  // Reports
  reports: {
    title: string;
    subtitle: string;
    dateRange: string;
    generate: string;
    download: string;
    noData: string;
    revenue: string;
    expenses: string;
    profit: string;
    jobsCompleted: string;
    // Additional keys
    loadingError: string;
    unableToLoad: string;
    checkConnection: string;
    retry: string;
    exportInProgress: string;
    exportSuccess: string;
    exportError: string;
    detailedMetrics: string;
    totalRevenue: string;
    transactions: string;
    successRate: string;
    averageAmount: string;
    thisMonth: string;
    total: string;
    performance: string;
    perTransaction: string;
    // Filters
    filters: {
      title: string;
      period: {
        label: string;
        today: string;
        thisWeek: string;
        thisMonth: string;
        thisQuarter: string;
        thisYear: string;
        custom: string;
      };
      status: {
        label: string;
        all: string;
        succeeded: string;
        pending: string;
        failed: string;
      };
      paymentMethod: {
        label: string;
        all: string;
        card: string;
        bankTransfer: string;
        wallet: string;
      };
      amount: {
        label: string;
        all: string;
        modalTitle: string;
        min: string;
        max: string;
        minPlaceholder: string;
        maxPlaceholder: string;
      };
      reset: string;
      cancel: string;
      apply: string;
    };
  };

  // Staff Modals
  staffModals: {
    addStaff: {
      title: string;
      close: string;
      back: string;
      // Validation errors
      validation: {
        error: string;
        nameRequired: string;
        firstNameRequired: string;
        lastNameRequired: string;
        emailRequired: string;
        emailInvalid: string;
        phoneRequired: string;
        positionRequired: string;
        roleRequired: string;
        teamRequired: string;
        hourlyRateRequired: string;
        hourlyRateInvalid: string;
        contractorNameRequired: string;
        contractorEmailRequired: string;
        contractorPhoneRequired: string;
        inviteError: string;
      };
      // Success messages
      success: {
        invitationSent: string;
        invitationSentMessage: string;
        contractorAdded: string;
        contractorAddedMessage: string;
      };
      // Confirm dialogs
      confirm: {
        addContractor: string;
        addContractorMessage: string;
        cancel: string;
        add: string;
      };
      // Step: Member type selection
      typeStep: {
        title: string;
        subtitle: string;
        employee: {
          title: string;
          description: string;
          feature1: string;
          feature2: string;
          feature3: string;
        };
        contractor: {
          title: string;
          description: string;
          feature1: string;
          feature2: string;
          feature3: string;
        };
      };
      // Step: Employee form
      employeeForm: {
        title: string;
        description: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        position: string;
        team: string;
        hourlyRate: string;
        selectPosition: string;
        selectTeam: string;
        submit: string;
        submitting: string;
      };
      // Step: Contractor search
      contractorSearch: {
        title: string;
        placeholder: string;
        search: string;
        or: string;
        inviteNew: string;
      };
      // Step: Contractor results
      contractorResults: {
        title: string;
        noResults: string;
        noResultsSubtext: string;
        add: string;
        abn: string;
        email: string;
        phone: string;
      };
      // Step: Contractor invite
      contractorInvite: {
        title: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        abn: string;
        abnPlaceholder: string;
        infoText: string;
        submit: string;
        submitting: string;
      };
    };
    editStaff: {
      validation: {
        error: string;
        nameRequired: string;
        emailRequired: string;
        positionRequired: string;
      };
      success: {
        title: string;
        message: string;
      };
      error: {
        title: string;
        message: string;
      };
    };
  };

  // Roles Management
  roles: {
    title: string;
    subtitle: string;
    createRole: string;
    editRole: string;
    deleteRole: string;
    newRole: string;
    systemRole: string;
    customRole: string;
    permissions: string;
    permissionsCount: string;
    staffCount: string;
    scope: string;
    scopes: {
      all: string;
      team: string;
      assigned: string;
    };
    form: {
      slugLabel: string;
      slugPlaceholder: string;
      slugHint: string;
      displayNameLabel: string;
      displayNamePlaceholder: string;
      descriptionLabel: string;
      descriptionPlaceholder: string;
      scopeLabel: string;
      permissionsLabel: string;
    };
    validation: {
      nameRequired: string;
      slugRequired: string;
      permissionsRequired: string;
    };
    alerts: {
      createSuccess: string;
      updateSuccess: string;
      deleteSuccess: string;
      createError: string;
      updateError: string;
      deleteError: string;
      genericError: string;
    };
    confirmDelete: {
      title: string;
      message: string;
    };
    categories: {
      jobs: string;
      staff: string;
      vehicles: string;
      clients: string;
      teams: string;
      finances: string;
      reports: string;
      settings: string;
      roles: string;
    };
    emptyState: {
      title: string;
      message: string;
    };
    loading: string;
    retry: string;
    search: string;
  };

  // Teams Management
  teams: {
    title: string;
    subtitle: string;
    createTeam: string;
    editTeam: string;
    deleteTeam: string;
    newTeam: string;
    membersCount: string;
    leader: string;
    noLeader: string;
    form: {
      nameLabel: string;
      namePlaceholder: string;
      descriptionLabel: string;
      descriptionPlaceholder: string;
      leaderLabel: string;
      leaderNone: string;
      membersLabel: string;
    };
    validation: {
      nameRequired: string;
    };
    alerts: {
      createSuccess: string;
      updateSuccess: string;
      deleteSuccess: string;
      createError: string;
      updateError: string;
      deleteError: string;
      unknownError: string;
    };
    confirmDelete: {
      title: string;
      message: string;
    };
    emptyState: {
      title: string;
      message: string;
      noResults: string;
    };
    loading: string;
    search: string;
  };

  // Leaderboard
  leaderboard: {
    title: string;
    drivers: string;
    loading: string;
    error: string;
    empty: string;
    rank: string;
    level: string;
    xp: string;
    you: string;
    top: string;
    yourRank: string;
    topDrivers: string;
    jobs: string;
    thisWeek: string;
    thisMonth: string;
    thisYear: string;
    allTime: string;
  };

  // Badges
  badges: {
    title: string;
    loading: string;
    earned: string;
    earnedBadges: string;
    availableBadges: string;
    empty: string;
    categories: {
      all: string;
      driver: string;
      offsider: string;
      business: string;
      rating: string;
      streak: string;
      level: string;
      special: string;
    };
  };

  // XP History
  xpHistory: {
    title: string;
    loading: string;
    entries: string;
    empty: string;
    emptyDescription: string;
    justNow: string;
    minutesAgo: string;
    hoursAgo: string;
    daysAgo: string;
    loadMore: string;
    noMoreEntries: string;
  };
}

export type TranslationFunction = (
  key: string,
  params?: Record<string, string | number>,
) => string;
export type NestedKeyOf<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}.${NestedKeyOf<T[K]>}`
          : K
        : never;
    }[keyof T]
  : never;

export type TranslationKey = NestedKeyOf<TranslationKeys>;
