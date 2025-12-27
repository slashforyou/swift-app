import { TranslationKeys } from '../types';

// Note: Spanish translations are partial - using type assertion
export const esTranslations = {
    common: {
        save: 'Guardar',
        cancel: 'Cancelar',
        delete: 'Eliminar',
        edit: 'Editar',
        add: 'Añadir',
        search: 'Buscar',
        loading: 'Cargando...',
        error: 'Error',
        success: 'Éxito',
        warning: 'Advertencia',
        info: 'Info',
        yes: 'Sí',
        no: 'No',
        ok: 'OK',
        close: 'Cerrar',
        back: 'Atrás',
        next: 'Siguiente',
        previous: 'Anterior',
        done: 'Hecho',
        continue: 'Continuar',
        skip: 'Saltar',
        retry: 'Reintentar',
        refresh: 'Actualizar',
        settings: 'Configuración',
        language: 'Idioma',
    },

    home: {
        title: 'Inicio',
        welcome: '¡Bienvenido de nuevo!',
        today: {
            title: 'Hoy',
            loading: 'Cargando...',
            noJobs: 'Sin trabajos',
            allCompleted: 'Todo completado',
            pending: 'pendientes',
            totalJobs: 'trabajos',
            completed: 'completados',
        },
        calendar: {
            title: 'Calendario',
            description: 'Ver y gestionar tu horario',
        },
        business: {
            title: 'Negocio',
            description: 'Facturación, configuración y gestión',
        },
        jobs: {
            title: 'Trabajos',
            description: 'Gestionar tus asignaciones de trabajo',
        },
        profile: {
            title: 'Perfil',
            description: 'Ver y editar tu perfil',
        },
        parameters: {
            title: 'Configuración',
            description: 'Configurar preferencias de la app',
        },
        connection: {
            title: 'Conexión',
            description: 'Probar conectividad del servidor',
            testConnection: 'Probar Conexión',
            status: {
                connected: 'Conectado',
                disconnected: 'Desconectado',
                testing: 'Probando...',
            },
        },
    },

    navigation: {
        home: 'Inicio',
        calendar: 'Calendario',
        jobs: 'Trabajos',
        profile: 'Perfil',
        settings: 'Configuración',
    },

    jobs: {
        title: 'Trabajos',
        status: {
            pending: 'Pendiente',
            inProgress: 'En Progreso',
            completed: 'Completado',
            cancelled: 'Cancelado',
        },
        timer: {
            start: 'Iniciar Cronómetro',
            stop: 'Detener Cronómetro',
            pause: 'Pausar',
            resume: 'Reanudar',
            break: 'Tomar Descanso',
            endBreak: 'Terminar Descanso',
            totalTime: 'Tiempo Total',
            billableTime: 'Tiempo Facturable',
            breakTime: 'Tiempo de Descanso',
            currentStep: 'Paso Actual',
        },
        details: {
            information: 'Información',
            items: 'Elementos',
            contacts: 'Contactos',
            timeline: 'Cronología',
            payment: 'Pago',
            summary: 'Resumen',
        },
    },

    calendar: {
        title: 'Calendario',
        days: {
            mon: 'Lun',
            tue: 'Mar',
            wed: 'Mié',
            thu: 'Jue',
            fri: 'Vie',
            sat: 'Sáb',
            sun: 'Dom',
        },
        months: {
            january: 'Enero',
            february: 'Febrero',
            march: 'Marzo',
            april: 'Abril',
            may: 'Mayo',
            june: 'Junio',
            july: 'Julio',
            august: 'Agosto',
            september: 'Septiembre',
            october: 'Octubre',
            november: 'Noviembre',
            december: 'Diciembre',
        },
        stats: {
            totalJobs: 'Total Trabajos',
            urgent: 'Urgente',
            completed: 'Completado',
        },
        refresh: 'Actualizar',
        goToDay: 'Ir al día',
        previousMonth: 'Mes anterior',
        nextMonth: 'Mes siguiente',
        filters: {
            all: 'Todos',
            pending: 'Pendiente',
            active: 'Activo',
            done: 'Hecho',
        },
        sorting: {
            time: 'Hora',
            priority: 'Prioridad',
            status: 'Estado',
        },
        previousDay: 'Día anterior',
        nextDay: 'Día siguiente',
        currentYear: 'Año Actual',
        years: 'Años',
        selectFromRange: 'Seleccionar desde',
        loading: 'Cargando...',
        noJobsScheduled: 'No hay trabajos programados',
        freeDay: 'Tienes un día libre el',
        enjoyTimeOff: '¡Disfruta tu tiempo libre!',
        somethingWentWrong: 'Algo salió mal',
        tryAgain: 'Intentar de Nuevo',
        jobStatus: {
            pending: 'Pendiente',
            inProgress: 'En Progreso',
            completed: 'Completado',
            cancelled: 'Cancelado',
            unknown: 'Desconocido',
        },
        priority: {
            urgent: 'URGENTE',
            high: 'ALTA',
            medium: 'MEDIA',
            low: 'BAJA',
            normal: 'NORMAL',
        },
        unknownClient: 'Cliente desconocido',
        navigation: {
            monthlyView: 'Vista Mensual',
            yearlyView: 'Vista Anual',
            multiYearView: 'Vista Multi-Año',
            dailyView: 'Vista Diaria',
            loadingCalendar: 'Cargando calendario',
            authenticationError: 'Error de Autenticación',
            goToLogin: 'Ir a Iniciar Sesión',
            loading: 'Cargando',
        },
        dayScreen: {
            stats: {
                total: 'Total',
                pending: 'Pendiente',
                completed: 'Completados',
            },
            filtersTitle: 'Trabajos y Filtros',
            sortBy: 'Ordenar por:',
        },
    },

    profile: {
        title: 'Perfil',
        personalInfo: 'Información Personal',
        preferences: 'Preferencias',
        logout: 'Cerrar Sesión',
        version: 'Versión',
        level: 'Nivel',
        experience: 'Experiencia',
        toNextLevel: 'al Nivel',
        defaultTitle: 'Conductor',
    },

    jobDetails: {
        panels: {
            summary: 'Resumen del Trabajo',
            jobDetails: 'Detalles del Trabajo',
            clientInfo: 'Información del Cliente',
            notes: 'Notas',
            payment: 'Pago',
        },
        errors: {
            invalidJobId: 'ID de trabajo inválido',
            cannotLoadDetails: 'No se pueden cargar los detalles del trabajo',
            loadingError: 'Error de Carga',
        },
        steps: {
            pickup: 'Recogida',
            intermediate: 'Intermedio',
            dropoff: 'Entrega',
            pickupDescription: 'Recogida en la ubicación del cliente',
            intermediateDescription: 'Entrega en la ubicación intermedia',
            dropoffDescription: 'Entrega en la ubicación final',
        },
        client: {
            firstTimeClient: 'Cliente Nuevo',
        },
        defaultNote: 'Nota',
        messages: {
            noteAdded: 'Nota Añadida',
            noteAddedSuccess: 'La nota se ha guardado exitosamente',
            noteAddError: 'Error',
            noteAddErrorMessage: 'No se pudo añadir la nota. Por favor, inténtalo de nuevo.',
            photoAdded: 'Foto Añadida',
            photoAddedSuccess: 'La foto se ha subido exitosamente',
            photoAddError: 'Error',
            photoAddErrorMessage: 'No se pudo añadir la foto. Por favor, inténtalo de nuevo.',
            photoDescription: 'Foto del trabajo',
            nextStep: 'Siguiente Paso',
            advancedToStep: 'Avanzado al paso',
        },
    },

    settings: {
        title: 'Configuración',
        language: {
            title: 'Idioma',
            description: 'Elige tu idioma preferido',
            current: 'Idioma actual',
            select: 'Seleccionar idioma',
        },
        theme: {
            title: 'Tema',
            light: 'Claro',
            dark: 'Oscuro',
            auto: 'Automático',
        },
        notifications: {
            title: 'Notificaciones',
            enabled: 'Activadas',
            disabled: 'Desactivadas',
        },
    },

    business: {
        navigation: {
            loadingBusiness: 'Cargando sección de negocio...',
            authenticationError: 'Error de autenticación',
            goToLogin: 'Ir a iniciar sesión',
            businessInfo: 'Info del Negocio',
            staffCrew: 'Personal/Equipo',
            trucks: 'Vehículos',
            jobsBilling: 'Trabajos/Facturación',
        },
        info: {
            title: 'Información del Negocio',
            placeholder: 'Esta sección contendrá la información de tu negocio: datos de contacto, configuración, ajustes generales.',
        },
        staff: {
            title: 'Personal y Equipo',
            placeholder: 'Gestiona tu equipo aquí: añade miembros, asigna roles, rastrea habilidades y disponibilidad.',
        },
        trucks: {
            title: 'Vehículos y Equipo',
            placeholder: 'Gestiona tu flota y equipo: añade camiones, rastrea mantenimiento, programa reparaciones.',
        },
        jobs: {
            title: 'Trabajos y Facturación',
            placeholder: 'Crea nuevos trabajos, genera facturas y rastrea la rentabilidad de tus proyectos.',
        },
    },

    messages: {
        errors: {
            network: 'Error de conexión de red',
            generic: 'Algo salió mal',
            notFound: 'Recurso no encontrado',
            unauthorized: 'Acceso no autorizado',
            serverError: 'Error del servidor',
            validation: 'Entrada inválida',
        },
        success: {
            saved: 'Guardado exitosamente',
            deleted: 'Eliminado exitosamente',
            updated: 'Actualizado exitosamente',
            created: 'Creado exitosamente',
        },
    },

    // Note: Spanish translations are partial - extend as needed for full i18n support
    payment: {
        missingInfo: { title: 'Información faltante', message: 'Complete todos los campos.' },
        errors: { 
            jobIdNotFound: 'ID de trabajo no encontrado',
            paymentError: 'Error de pago',
            generic: 'Error',
            processingFailed: 'Error al procesar el pago.',
            networkError: 'Error de conexión'
        },
        buttons: { processing: 'Procesando...', confirm: 'Confirmar pago', retry: 'Reintentar' },
        status: { processing: 'Procesando...', success: 'Pago exitoso', failed: 'Pago fallido' },
        summary: { total: 'Total', tax: 'Impuesto', subtotal: 'Subtotal' }
    },

    vehicles: {
        title: 'Vehículos',
        addNew: 'Añadir vehículo',
        edit: 'Editar vehículo',
        delete: 'Eliminar vehículo',
        fields: {
            plate: 'Placa',
            model: 'Modelo', 
            year: 'Año',
            type: 'Tipo',
            status: 'Estado'
        },
        types: { truck: 'Camión', van: 'Furgoneta', car: 'Auto', motorcycle: 'Motocicleta', other: 'Otro' },
        statuses: { active: 'Activo', maintenance: 'Mantenimiento', inactive: 'Inactivo', retired: 'Retirado' },
        maintenance: { title: 'Mantenimiento', addRecord: 'Añadir registro', date: 'Fecha', description: 'Descripción', cost: 'Costo' },
        emptyState: { title: 'Sin vehículos', subtitle: 'Añada su primer vehículo' }
    },

    staff: {
        title: 'Personal',
        addEmployee: 'Añadir empleado',
        addContractor: 'Añadir contratista', 
        invite: 'Invitar',
        role: { employee: 'Empleado', contractor: 'Contratista' },
        status: { active: 'Activo', inactive: 'Inactivo', pending: 'Pendiente' },
        fields: { name: 'Nombre', email: 'Email', phone: 'Teléfono', hourlyRate: 'Tarifa por hora' },
        emptyState: { title: 'Sin personal', subtitle: 'Añada su primer miembro del equipo' }
    },
} as unknown as TranslationKeys;