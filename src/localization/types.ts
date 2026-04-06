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
  stripeGate: {
    title: string;
    message: string;
    cta: string;
  };
  completeProfile: {
    title: string;
    hint: string;
    businessDetails: string;
    companyName: string;
    tradingName: string;
    legalName: string;
    abn: string;
    acn: string;
    businessType: string;
    industryType: string;
    contactDetails: string;
    email: string;
    phone: string;
    website: string;
    address: string;
    streetAddress: string;
    suburb: string;
    state: string;
    postcode: string;
    banking: string;
    bankAccountName: string;
    bsb: string;
    bankAccountNumber: string;
    insurance: string;
    hasInsurance: string;
    insuranceProvider: string;
    policyNumber: string;
    insuranceExpiry: string;
    save: string;
    saveError: string;
    savedTitle: string;
    savedMessage: string;
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
    none?: string;
    checkingAuth?: string;
    later?: string;
    today?: string;
    yesterday?: string;
  };

  // Home Screen
  home: {
    title: string;
    welcome: string;
    today: {
      title: string;
      dateFormat?: string;
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
    contact: {
      title: string;
      yourMessage: string;
      helpLabel: string;
      feedbackLabel: string;
      featureLabel: string;
      bugLabel: string;
      placeholder: string;
      send: string;
      sending: string;
      cancel: string;
      thankYou: string;
      thankYouMessage: string;
      errorSending: string;
    };
    onboarding: {
      title: string;
      completed: string;
      completeProfile: string;
      createFirstJob: string;
      inviteTeam: string;
      setupPayments: string;
      planSuggestionTitle?: string;
      planSuggestionMessage?: string;
      planSuggestionCta?: string;
    };
    stripeAlert: {
      title: string;
      description: string;
      cta?: string;
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
    deleteConfirmTitle?: string;
    deleteConfirmMessage?: string;
    deleteSuccess?: string;
    deleteError?: string;
    acceptSuccess?: string;
    acceptError?: string;
    declineSuccess?: string;
    declineError?: string;
    acceptConfirmTitle?: string;
    acceptConfirmMessage?: string;
    acceptButton?: string;
    declineReasonRequired?: string;
    pendingActionTitle?: string;
    pendingActionMessage?: string;
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
    jobDetails?: string;
    priorityOptions?: {
      low?: string;
      medium?: string;
      high?: string;
      urgent?: string;
    };
    addressTypes?: { pickup?: string; delivery?: string };
    vehicleTypes?: {
      van?: string;
      truck?: string;
      "2-ton"?: string;
      pantech?: string;
    };
    extrasOptions?: { [key: string]: string };
    paymentMethods?: {
      cash?: string;
      card?: string;
      bank_transfer?: string;
      invoice?: string;
    };
    hours?: string;
    estimated?: string;
    marginMinutes?: string;
    exact?: string;
    naDepotDepot?: string;
    travelBilling?: string;
    callOutBilling?: string;
    depotDepotBillable?: string;
    callOutSummary?: string;
    roundingSummary?: string;
    paid?: string;
    pendingDeposit?: string;
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
    daysLong?: {
      mon?: string;
      tue?: string;
      wed?: string;
      thu?: string;
      fri?: string;
      sat?: string;
      sun?: string;
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
      timeSlot?: string;
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
    xpToNextLevelShort?: string;
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
      companyName?: string;
      role?: string;
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
    companyInfo?: string;
    companyNote?: string;
    roles?: {
      patron?: string;
      cadre?: string;
      employee?: string;
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
      assignStaff: string;
      quantityPlaceholder?: string;
      completedQuantityPlaceholder?: string;
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
      unread?: string;
      placeholder?: string;
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
        paid?: string;
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
        amountPlaceholder?: string;
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
        missionEnd?: string;
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
        onTheWay?: string;
        onTheWayNext?: string;
        noAddressAvailable?: string;
        callLabel?: string;
        gpsLabel?: string;
        noteLabel?: string;
        photoLabel?: string;
      };
      signature: {
        verifying: string;
        contractSigned: string;
        clientValidated: string;
        contractMustBeSigned: string;
        contractContent?: string;
        contractAcknowledge?: string;
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
      staffing?: {
        title?: string;
        providedBy?: string;
        vehicle?: string;
        team?: string;
        noResourceAssigned?: string;
        noResourceDescription?: string;
        assignResources?: string;
        addResource?: string;
        loading?: string;
        statusPending?: string;
        statusConfirmed?: string;
        statusDeclined?: string;
        statusCancelled?: string;
        statusReplaced?: string;
        statusUnassigned?: string;
        statusPartial?: string;
        statusFullyStaffed?: string;
        statusConflict?: string;
        roleDriver?: string;
        roleOffsider?: string;
        roleSupervisor?: string;
        roleVehicle?: string;
        workerNotSelected?: string;
        vehicleNotSelected?: string;
        workerNotSelectedDesc?: string;
        vehicleNotSelectedDesc?: string;
        cancelConfirmTitle?: string;
        cancelConfirmMessage?: string;
        cancelConfirmYes?: string;
        cancelConfirmNo?: string;
        delegation?: string;
        delegatedTo?: string;
        delegationPending?: string;
        delegationNegotiating?: string;
        delegationAccepted?: string;
        delegationDeclined?: string;
        delegationFullJob?: string;
        cancelDelegationTitle?: string;
        cancelDelegationMessage?: string;
        cancelDelegationYes?: string;
        error?: string;
        modal?: { [key: string]: string };
      };
      contact?: {
        title?: string;
        subtitle?: string;
        name?: string;
        phone?: string;
        call?: string;
      };
      company?: { [key: string]: string };
      stepHistory?: { [key: string]: string };
      addresses?: { [key: string]: string };
      statusBanner?: { [key: string]: string };
      financial?: { [key: string]: string };
      signaturePreview?: { [key: string]: string };
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
      paymentConfirmed?: string;
      alreadyPaid?: string;
      sendInvoice?: string;
      sendInvoiceConfirmTitle?: string;
      sendInvoiceConfirmMessage?: string;
      cancel?: string;
      send?: string;
      invoiceSent?: string;
      invoiceSendErrorTitle?: string;
      invoiceSendErrorMessage?: string;
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
    status: {
      available: string;
      "in-use": string;
      maintenance: string;
      "out-of-service": string;
      undefined: string;
    };
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
    assignSuccess?: string;
    unassignSuccess?: string;
    assignError?: string;
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
    forgotPassword: {
      title: string;
      subtitle: string;
      emailRequired: string;
      sendCode: string;
      codeSent: string;
      enterCode: string;
      codeSentTo: string;
      codeInvalid: string;
      verify: string;
      resendCode: string;
      newPasswordTitle: string;
      newPasswordSubtitle: string;
      newPassword: string;
      confirmPassword: string;
      passwordRequired: string;
      passwordTooShort: string;
      passwordMismatch: string;
      resetPassword: string;
      successTitle: string;
      successMessage: string;
      backToLogin: string;
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
      completeProfileTitle?: string;
      completeProfileMessage?: string;
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
    registration?: { [key: string]: unknown };
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
      paymentsEnabled?: string;
      paymentsDisabled?: string;
      paymentsHintEnabled?: string;
      paymentsHintDisabled?: string;
      openOnboardingLink?: string;
      noAccount?: string;
      accountInactive?: string;
      accountInactiveDesc?: string;
      savedInfo?: string;
      status?: string;
      payments?: string;
      payoutsLabel?: string;
      payoutsEnabled?: string;
      payoutsDisabled?: string;
      reason?: string;
      missingFields?: string;
      missingFieldsDesc?: string;
      otherFields?: string;
      deleteAccount?: string;
      deleteAccountTitle?: string;
      deleteAccountConfirm?: string;
      deleteSuccess?: string;
      deleteError?: string;
      navUnavailable?: string;
      accountInfo?: string;
      accountId?: string;
      notConnected?: string;
      revenueOverview?: string;
      totalRevenue?: string;
      thisMonth?: string;
      pendingPayouts?: string;
      successfulPayments?: string;
      quickActions?: string;
      createPaymentLink?: string;
      viewAllPayments?: string;
      managePayouts?: string;
      accountSettings?: string;
      testConnection?: string;
      poweredByStripe?: string;
      settingsAction?: string;
      paymentLinkAction?: string;
      connected?: string;
      loading?: string;
      details?: string;
      errorLabel?: string;
      retest?: string;
      stripeExplanation?: string;
      feePassToClient?: string;
      feePassToClientDesc?: string;
    };
    onboarding: {
      stepLabel: string;
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
          submissionTitle?: string;
          submissionMessage?: string;
          permissionMessage?: string;
        };
      };
      businessProfile: {
        title: string;
        subtitle: string;
        mcc: string;
        mccPlaceholder: string;
        url: string;
        urlPlaceholder: string;
        description: string;
        descriptionPlaceholder: string;
        nextButton: string;
        errors: {
          mccRequired: string;
          mccInvalid: string;
          urlRequired: string;
          urlInvalid: string;
          descriptionRequired: string;
          validationTitle: string;
          validationMessage: string;
          submissionTitle: string;
          submissionMessage: string;
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
      companyDetails: {
        title: string;
        subtitle: string;
        name: string;
        namePlaceholder: string;
        taxId: string;
        taxIdPlaceholder: string;
        companyNumber: string;
        companyNumberPlaceholder: string;
        phone: string;
        phonePlaceholder: string;
        line1: string;
        line1Placeholder: string;
        line2: string;
        line2Placeholder: string;
        city: string;
        cityPlaceholder: string;
        state: string;
        statePlaceholder: string;
        postalCode: string;
        postalCodePlaceholder: string;
        nextButton: string;
        errors: {
          nameRequired: string;
          taxIdRequired: string;
          phoneRequired: string;
          phoneInvalid: string;
          line1Required: string;
          cityRequired: string;
          stateRequired: string;
          postalCodeRequired: string;
          postalCodeInvalid: string;
          validationTitle: string;
          validationMessage: string;
          submissionTitle: string;
          submissionMessage: string;
        };
      };
      representative: {
        title: string;
        subtitle: string;
        firstName: string;
        firstNamePlaceholder: string;
        lastName: string;
        lastNamePlaceholder: string;
        dob: string;
        dobPlaceholder: string;
        email: string;
        emailPlaceholder: string;
        phone: string;
        phonePlaceholder: string;
        line1: string;
        line1Placeholder: string;
        line2: string;
        line2Placeholder: string;
        city: string;
        cityPlaceholder: string;
        state: string;
        statePlaceholder: string;
        postalCode: string;
        postalCodePlaceholder: string;
        titleLabel: string;
        titlePlaceholder: string;
        relationshipTitle: string;
        owner: string;
        director: string;
        executive: string;
        percentOwnership: string;
        percentOwnershipPlaceholder: string;
        percentOwnershipHint: string;
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
          line1Required: string;
          cityRequired: string;
          stateRequired: string;
          postalCodeRequired: string;
          postalCodeInvalid: string;
          titleRequired: string;
          relationshipRequired: string;
          percentOwnershipRequired: string;
          validationTitle: string;
          validationMessage: string;
          submissionTitle: string;
          submissionMessage: string;
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
          submissionTitle?: string;
          submissionMessage?: string;
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
          backRequired?: string;
          uploadTitle?: string;
          uploadMessage?: string;
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
        onFile: string;
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
          incompleteTitle?: string;
          incompleteMessage?: string;
          missingInfoList?: string;
          verificationInProgress?: string;
        };
      };
      errors?: {
        permissionDeniedTitle?: string;
        permissionDeniedMessage?: string;
        startTitle?: string;
        startMessage?: string;
        genericTitle?: string;
        genericMessage?: string;
      };
    };
    paymentLinksModal?: {
      noAccountTitle?: string;
      noAccountMessage?: string;
      invalidAmountTitle?: string;
      invalidAmountMessage?: string;
      createErrorMessage?: string;
      copiedTitle?: string;
      copiedMessage?: string;
      shareTitle?: string;
      shareMessage?: string;
    };
    completion?: {
      titlePending?: string;
      titleActive?: string;
      titleDefault?: string;
      subtitlePending?: string;
      subtitleActive?: string;
      subtitleDefault?: string;
      accountStatus?: string;
      detailsComplete?: string;
      detailsCompleteYes?: string;
      detailsCompleteNo?: string;
      paymentsLabel?: string;
      paymentsEnabled?: string;
      paymentsPending?: string;
      payoutsLabel?: string;
      payoutsEnabled?: string;
      payoutsPending?: string;
      validationDelayTitle?: string;
      validationDelayMessage?: string;
      nextStepsTitle?: string;
      nextStepsStep1?: string;
      nextStepsStep2?: string;
      nextStepsStep3?: string;
      nextStepsStep4?: string;
      returnToDashboard?: string;
    };
    accountStatus?: {
      title?: string;
      verified?: string;
      pending?: string;
      restricted?: string;
      rejected?: string;
      unknown?: string;
      businessType?: string;
      refresh?: string;
      actionsRequired?: string;
      moreActions?: string;
      completeInfo?: string;
      finalizeVerification?: string;
    };
    settings: {
      title: string;
      subtitle: string;
      accountInfo: string;
      payoutSchedule: string;
      placeholders?: {
        supportEmail?: string;
        supportPhone?: string;
        supportUrl?: string;
      };
      bankAccount: string;
      updateAccount: string;
      displayName: string;
      supportEmail: string;
      supportPhone: string;
      supportUrl: string;
      statementDescriptor: string;
      statementDescriptorPlaceholder: string;
      payoutInterval: string;
      debitNegativeBalances: string;
      // Sections
      sections: {
        accountSetup: string;
        paymentSettings: string;
        payoutSettings: string;
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
        successUpdate: string;
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
      receipt?: {
        unavailableTitle?: string;
        unavailableMessage?: string;
        cannotOpenUrl?: string;
        failedToOpen?: string;
      };
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
  // Negotiation (ContracteeNegotiationModal)
  negotiation?: {
    inNegotiation?: string;
    proposalFrom?: string;
    submittedOn?: string;
    proposedSlots?: string;
    start?: string;
    end?: string;
    estimatedDuration?: string;
    proposedPricing?: string;
    priceNotSpecified?: string;
    vehicle?: string;
    proposedTruck?: string;
    notSpecified?: string;
    teamComposition?: string;
    driver?: string;
    drivers?: string;
    offsider?: string;
    offsiders?: string;
    packer?: string;
    packers?: string;
    totalPersons?: string;
    providerNote?: string;
    message?: string;
    reject?: string;
    acceptProposal?: string;
    confirmAgreement?: string;
    accept?: string;
    rejectionReason?: string;
    rejectionReasonPlaceholder?: string;
    rejectionWarning?: string;
    backButton?: string;
    confirmRejection?: string;
    proposalAccepted?: string;
    proposalAcceptedDesc?: string;
    proposalRejected?: string;
    proposalRejectedDesc?: string;
    stepProposalReceived?: string;
    stepYourDecision?: string;
    negotiationComplete?: string;
    counterProposal?: string;
    yourResponse?: string;
    hourly?: string;
    daily?: string;
    flat?: string;
    perHour?: string;
    perDay?: string;
    errorAccept?: string;
    errorReject?: string;
  };

  // Contractor Job Wizard (ContractorJobWizardModal)
  contractorWizard?: {
    errorAcceptJob?: string;
    errorDeclineJob?: string;
    reasonRequired?: string;
    reasonRequiredMsg?: string;
    errorAssign?: string;
    errorAssignPartial?: string;
    slotsRequired?: string;
    slotsRequiredMsg?: string;
    errorCounterProposal?: string;
    unknownCompany?: string;
    priorityUrgent?: string;
    priorityHigh?: string;
    priorityMedium?: string;
    priorityLow?: string;
    assignedBy?: string;
    contact?: string;
    pendingResponse?: string;
    counterProposalSent?: string;
    accepted?: string;
    declined?: string;
    internalJob?: string;
    priority?: string;
    whatIsRequested?: string;
    driversLabel?: string;
    offsidersLabel?: string;
    requestedTruck?: string;
    hourlyPrice?: string;
    dailyPrice?: string;
    flatPrice?: string;
    resourceNote?: string;
    messageLabel?: string;
    clientSection?: string;
    nameLabel?: string;
    phoneLabel?: string;
    dateTimeSection?: string;
    dateLabel?: string;
    slotLabel?: string;
    estimatedDuration?: string;
    addressesSection?: string;
    pickupLabel?: string;
    deliveryLabel?: string;
    notesSection?: string;
    respond?: string;
    jobFrom?: string;
    reference?: string;
    acceptJobQuestion?: string;
    refuse?: string;
    newProposal?: string;
    backButton?: string;
    jobAccepted?: string;
    assignEmployees?: string;
    searchEmployee?: string;
    noActiveEmployee?: string;
    later?: string;
    confirmCount?: string;
    finish?: string;
    jobRefusal?: string;
    refusalReason?: string;
    refusalPlaceholder?: string;
    confirmRefusal?: string;
    requested?: string;
    counterProposalLabel?: string;
    originalProposal?: string;
    newSlot?: string;
    startHHMM?: string;
    endHHMM?: string;
    proposedPrice?: string;
    flatType?: string;
    hourlyType?: string;
    proposedVehicle?: string;
    noneOption?: string;
    proposedResources?: string;
    packersLabel?: string;
    noteOptional?: string;
    counterNotePlaceholder?: string;
    sendProposal?: string;
    proposalSent?: string;
    proposalSentDesc?: string;
    jobAcceptedSuccess?: string;
    employeesAssigned?: string;
    jobAcceptedNoStaff?: string;
    jobDeclined?: string;
    jobDeclinedDesc?: string;
    // Step config
    stepOverview?: string;
    stepOverviewTitle?: string;
    stepDecision?: string;
    stepDecisionTitle?: string;
    stepTeam?: string;
    stepTeamTitle?: string;
    stepRefusal?: string;
    stepRefusalTitle?: string;
    stepCounter?: string;
    stepCounterTitle?: string;
    stepDone?: string;
    stepDoneTitle?: string;
    stepConfirmed?: string;
    stepDeclinedTitle?: string;
  };

  // Transfer (TransferBannerSection)
  transfer?: {
    pending?: string;
    negotiating?: string;
    acceptedStatus?: string;
    declinedStatus?: string;
    cancelledStatus?: string;
    cancelDelegation?: string;
    cancelDelegationConfirm?: string;
    cancelDelegationBtn?: string;
    errorCancel?: string;
    acceptDelegation?: string;
    acceptDelegationConfirm?: string;
    errorAccept?: string;
    invalidAmount?: string;
    invalidAmountMsg?: string;
    errorSubmit?: string;
    errorDecline?: string;
    delegationLabel?: string;
    sentTo?: string;
    receivedFrom?: string;
    reason?: string;
    counterProposalFromContractor?: string;
    cancelBtn?: string;
    declineBtn?: string;
    negotiateBtn?: string;
    acceptBtn?: string;
    counterProposalPending?: string;
    declineReasonLabel?: string;
    declinePlaceholder?: string;
    confirmDecline?: string;
    counterProposalTitle?: string;
    currentPrice?: string;
    newAmountPlaceholder?: string;
    explanationPlaceholder?: string;
    sendCounterProposal?: string;
  };

  // DelegateJobWizard
  delegateWizard?: {
    manageResources?: string;
    jobManagement?: string;
    whatDoYouWant?: string;
    addTruckStaff?: string;
    addTruckStaffDesc?: string;
    delegatePart?: string;
    delegatePartDesc?: string;
    delegateFull?: string;
    delegateFullDesc?: string;
    selectResources?: string;
    summary?: string;
    trucks?: string;
    noVehicleAvailable?: string;
    staff?: string;
    noActiveStaff?: string;
    driver?: string;
    offsider?: string;
    roleToDelegate?: string;
    describeRole?: string;
    associatedVehicle?: string;
    none?: string;
    pricing?: string;
    hourly?: string;
    flat?: string;
    hourCounting?: string;
    depotToDepot?: string;
    siteOnly?: string;
    recipient?: string;
    orAddByCode?: string;
    messageOptional?: string;
    messagePlaceholder?: string;
    requestedResources?: string;
    preferredTruck?: string;
    anyChoice?: string;
    drivers?: string;
    offsiders?: string;
    resourcesToAssign?: string;
    partialDelegation?: string;
    fullDelegation?: string;
    role?: string;
    fullJob?: string;
    vehicle?: string;
    price?: string;
    perHour?: string;
    flatRate?: string;
    recipientLabel?: string;
    requestedTeam?: string;
    driverCount?: string;
    offsiderCount?: string;
    message?: string;
    assign?: string;
    delegateTo?: string;
    send?: string;
    next?: string;
    back?: string;
    error?: string;
    errorSendDelegation?: string;
    delegationSuccess?: string;
  };

  // Relations (RelationsScreen)
  relations?: {
    alreadyRegistered?: string;
    alreadyRegisteredMsg?: string;
    errorRegister?: string;
    rename?: string;
    deleteLabel?: string;
    deleteConfirm?: string;
    deleteConfirmMsg?: string;
    errorDelete?: string;
    errorRename?: string;
    yourCompanyCode?: string;
    copied?: string;
    copy?: string;
    shareCodeHint?: string;
    howToAdd?: string;
    step1?: string;
    step2?: string;
    step3?: string;
    step4?: string;
    contactBook?: string;
    addLabel?: string;
    emptyBook?: string;
    emptyBookHint?: string;
    addRelation?: string;
    addRelationTitle?: string;
    nicknamePlaceholder?: string;
    saving?: string;
    renameTitle?: string;
    newNickname?: string;
  };

  // Ownership (JobOwnershipBanner)
  ownership?: {
    pendingAcceptance?: string;
    acceptedStatus?: string;
    declinedStatus?: string;
    yourJob?: string;
    jobFrom?: string;
    partiesInvolved?: string;
    creatorLabel?: string;
    by?: string;
    executorLabel?: string;
    assignedTo?: string;
  };

  // Assignment Actions (JobAssignmentActions)
  assignmentActions?: {
    actionRequired?: string;
    actionRequiredDesc?: string;
    acceptBtn?: string;
    declineBtn?: string;
    declineJobTitle?: string;
    declineJobDesc?: string;
    confirmBtn?: string;
  };

  // Invoice Edit (InvoiceCreateEditModal)
  invoiceEdit?: {
    editInvoice?: string;
    newInvoice?: string;
    clientInfo?: string;
    clientName?: string;
    clientEmail?: string;
    invoiceDetails?: string;
    invoiceNumber?: string;
    description?: string;
    dueDate?: string;
    datePlaceholder?: string;
    elements?: string;
    addBtn?: string;
    descriptionLabel?: string;
    quantity?: string;
    unitPrice?: string;
    total?: string;
    removeBtn?: string;
    invoiceTotal?: string;
    deleteBtn?: string;
    savingBtn?: string;
    saveBtn?: string;
  };

  // Create Invoice (CreateInvoiceModal)
  createInvoice?: {
    title?: string;
    subtitle?: string;
    clientInfo?: string;
    clientName?: string;
    email?: string;
    clientAddress?: string;
    jobDetails?: string;
    jobType?: string;
    moveDate?: string;
    fromAddress?: string;
    toAddress?: string;
    invoiceItems?: string;
    descriptionHeader?: string;
    qtyHeader?: string;
    rateHeader?: string;
    amountHeader?: string;
    addService?: string;
    subtotal?: string;
    totalLabel?: string;
    paymentTerms?: string;
    additionalNotes?: string;
    creating?: string;
    createBtn?: string;
    selectService?: string;
    customService?: string;
    // Job types
    residential?: string;
    commercial?: string;
    interstate?: string;
    storage?: string;
    packing?: string;
    specialty?: string;
    // Payment terms
    dueOnCompletion?: string;
    dueOnCompletionDesc?: string;
    net7?: string;
    net7Desc?: string;
    net14?: string;
    net14Desc?: string;
    net30?: string;
    net30Desc?: string;
    // Validation
    clientNameRequired?: string;
    clientEmailRequired?: string;
    invalidEmail?: string;
    moveDateRequired?: string;
    fromAddressRequired?: string;
    toAddressRequired?: string;
    itemRequired?: string;
    // Common services
    movingBaseRate?: string;
    labourPerHour?: string;
    truckRental?: string;
    truckRentalSmall?: string;
    truckRentalLarge?: string;
    packingPerHour?: string;
    unpackingPerHour?: string;
    disassemblyAssembly?: string;
    pianoMoving?: string;
    storagePerMonth?: string;
    interstateSurcharge?: string;
    packingMaterials?: string;
    insurancePremium?: string;
    newService?: string;
  };

  // Payment Link (CreatePaymentLinkModal)
  paymentLink?: {
    title?: string;
    linkReady?: string;
    linkReadyDesc?: string;
    copyBtn?: string;
    shareBtn?: string;
    doneBtn?: string;
    createTitle?: string;
    defaultDescription?: string;
    amountLabel?: string;
    descriptionLabel?: string;
    customerEmail?: string;
    createBtn?: string;
  };

  // Edit Job (EditJobModal)
  editJobModal?: {
    title?: string;
    statusLabel?: string;
    priorityLabel?: string;
    addressesLabel?: string;
    pickupType?: string;
    deliveryType?: string;
    streetPlaceholder?: string;
    cityPlaceholder?: string;
    statePlaceholder?: string;
    scheduleLabel?: string;
    startTime?: string;
    endTime?: string;
    notesLabel?: string;
    notesPlaceholder?: string;
    updateSuccess?: string;
    updateError?: string;
    // Priority & status options
    low?: string;
    medium?: string;
    high?: string;
    urgent?: string;
    statusPending?: string;
    statusInProgress?: string;
    statusCompleted?: string;
    statusCancelled?: string;
  };

  // Edit Vehicle (EditVehicleModal)
  editVehicle?: {
    title?: string;
    makeLabel?: string;
    modelLabel?: string;
    yearLabel?: string;
    registrationLabel?: string;
    registrationHint?: string;
    capacityLabel?: string;
    nextServiceLabel?: string;
    depotLabel?: string;
    updateBtn?: string;
    // Validation
    makeRequired?: string;
    modelRequired?: string;
    yearInvalid?: string;
    registrationRequired?: string;
    registrationFormatError?: string;
    serviceDateFuture?: string;
    locationRequired?: string;
    // Vehicle types
    movingTruck?: string;
    van?: string;
    trailer?: string;
    ute?: string;
    dolly?: string;
    toolsEquipment?: string;
  };

  // Payout Detail (PayoutDetailModal)
  payout?: {
    title?: string;
    amountLabel?: string;
    transactionDetails?: string;
    payoutId?: string;
    createdDate?: string;
    expectedArrival?: string;
    at?: string;
    typeLabel?: string;
    bankTransfer?: string;
    destination?: string;
    bankAccount?: string;
    statusTimeline?: string;
    payoutCreated?: string;
    inTransit?: string;
    processing?: string;
    pendingStatus?: string;
    delivered?: string;
    completedStatus?: string;
    failedStatus?: string;
  };

  // Job Template (AddJobTemplateModal)
  jobTemplate?: {
    title?: string;
    subtitle?: string;
    serviceCategory?: string;
    basicInfo?: string;
    templateName?: string;
    templateNameHint?: string;
    description?: string;
    duration?: string;
    basePrice?: string;
    pricingStructure?: string;
    pricingType?: string;
    rate?: string;
    minCharge?: string;
    perHour?: string;
    perM3?: string;
    fixedAmount?: string;
    requirements?: string;
    staffRequired?: string;
    staffRequiredHint?: string;
    vehicleTypes?: string;
    equipmentNeeded?: string;
    whatsIncluded?: string;
    creating?: string;
    createBtn?: string;
    // Categories
    residentialMove?: string;
    commercialMove?: string;
    interstateMove?: string;
    storageServices?: string;
    packingServices?: string;
    specialtyItems?: string;
    // Pricing types
    fixedPrice?: string;
    hourlyRate?: string;
    volumeBased?: string;
  };

  // Staff Management (EditStaffModal)
  staffMgmt?: {
    editEmployee?: string;
    editContractor?: string;
    employeeTFN?: string;
    contractorABN?: string;
    personalInfo?: string;
    firstName?: string;
    lastName?: string;
    emailLabel?: string;
    phoneLabel?: string;
    positionAndTeam?: string;
    position?: string;
    team?: string;
    statusSection?: string;
    active?: string;
    pendingStatus?: string;
    inactive?: string;
    compensation?: string;
    hourlyRateLabel?: string;
    rateType?: string;
    hourlyType?: string;
    fixedType?: string;
    projectType?: string;
    rateLabel?: string;
    contractStatus?: string;
    standard?: string;
    nonExclusive?: string;
    exclusive?: string;
    preferred?: string;
    // AddStaffModal (business)
    addTitle?: string;
    addSubtitle?: string;
    tfnLabel?: string;
    tfnHint?: string;
    roleLabel?: string;
    roleHint?: string;
    teamLabel?: string;
    // Validation
    firstNameRequired?: string;
    lastNameRequired?: string;
    tfnRequired?: string;
    tfnInvalid?: string;
    phoneRequired?: string;
    phoneInvalid?: string;
    emailRequired?: string;
    emailInvalid?: string;
    hourlyRateRequired?: string;
    hourlyRateInvalid?: string;
  };

  // Add Vehicle (business modals)
  addVehicle?: {
    title?: string;
    subtitle?: string;
    vehicleType?: string;
    vehicleName?: string;
    registrationRequired?: string;
    registrationInvalid?: string;
    modelRequired?: string;
    yearRequired?: string;
  };

  // Analytics Dashboard
  analytics?: {
    loadingMetrics?: string;
    title?: string;
    subtitle?: string;
    period24h?: string;
    period7d?: string;
    period30d?: string;
    jobsProgression?: string;
    totalJobs?: string;
    created?: string;
    completedLabel?: string;
    inProgress?: string;
    active?: string;
    stripePayments?: string;
    revenue?: string;
    aud?: string;
    transactions?: string;
    usersEngagement?: string;
    activeUsers?: string;
    period?: string;
    sessions?: string;
    systemPerformance?: string;
    apiResponse?: string;
    average?: string;
    uptime?: string;
    availability?: string;
    errorRate?: string;
    apiErrors?: string;
  };

  // Payments Dashboard
  paymentsDashboard?: {
    loadError?: string;
    availableBalance?: string;
    pendingLabel?: string;
    newPayment?: string;
    createInvoice?: string;
    requestTransfer?: string;
    viewReports?: string;
    quickActions?: string;
    statistics?: string;
    statisticsPlaceholder?: string;
    recentPayments?: string;
    recentPaymentsPlaceholder?: string;
  };

  registration?: { [key: string]: unknown };
  connectionScreen?: {
    logoText?: string;
    title?: string;
    subtitle?: string;
    loginButton?: string;
    createAccountButton?: string;
    features?: { [key: string]: string };
  };
  parametersModernized?: { [key: string]: unknown };
  invoices?: { [key: string]: unknown };
  businessModals?: { [key: string]: unknown };
  devMenu?: { [key: string]: unknown };
  devTools?: { [key: string]: unknown };

  // Support messaging
  support?: {
    title?: string;
    newConversation?: string;
    emptyTitle?: string;
    emptyDescription?: string;
    admin?: string;
    noMessages?: string;
    messagePlaceholder?: string;
    chooseCategory?: string;
    subjectLabel?: string;
    messageLabel?: string;
    send?: string;
    sending?: string;
    errorSending?: string;
    categories?: {
      help?: string;
      feedback?: string;
      feature?: string;
      bug?: string;
    };
    status?: {
      open?: string;
      answered?: string;
      closed?: string;
    };
  };

  // Subscription
  subscription?: {
    title?: string;
    currentPlan?: string;
    yourUsage?: string;
    allPlans?: string;
    unlimited?: string;
    free?: string;
    users?: string;
    includedUsers?: string;
    extraUsers?: string;
    perUser?: string;
    jobsPerMonth?: string;
    jobsThisMonth?: string;
    jobsRemaining?: string;
    commission?: string;
    branding?: string;
    prioritySupport?: string;
  };

  // Contracts — Modular contract clauses
  signature?: {
    title?: string;
    signed?: string;
    signedOn?: string;
    viewContract?: string;
    contractTitle?: string;
    noClausesConfigured?: string;
    bySigningPrefix?: string;
    contractLink?: string;
    bySigningSuffix?: string;
    signButton?: string;
  };

  contracts?: {
    title?: string;
    subtitle?: string;
    addClause?: string;
    deleteTitle?: string;
    deleteMessage?: string;
    emptyTitle?: string;
    emptyMessage?: string;
    newClause?: string;
    editClause?: string;
    clauseTitle?: string;
    clauseTitlePlaceholder?: string;
    clauseContent?: string;
    clauseContentPlaceholder?: string;
    conditions?: string;
    conditionLabel?: string;
    conditionsHelp?: string;
    titleRequired?: string;
    contentRequired?: string;
    saveError?: string;
    contractSection?: string;
    generateHint?: string;
    generateButton?: string;
    generateError?: string;
    clausesCount?: string;
    regenerate?: string;
    signButton?: string;
  };

  validation?: {
    password?: {
      tooShort?: string;
      needsUppercase?: string;
      needsLowercase?: string;
      needsNumber?: string;
      needsSpecial?: string;
    };
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
