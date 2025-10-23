/**
 * Index des services business
 * Services API pour la gestion complète de l'entreprise
 */

// Services API
export * from './businessService';
export * from './invoicesService';
export * from './templatesService';
export * from './vehiclesService';

// Services internes avec AsyncStorage
export * from './staffService';

// Types consolidés par service
export type {
    BusinessInfo,
    BusinessStats
} from './businessService';

export type {
    BusinessVehicle,
    VehicleCreateData
} from './vehiclesService';

export type {
    JobTemplate,
    TemplateCreateData
} from './templatesService';

export type {
    Invoice, InvoiceCreateData, InvoiceItem
} from './invoicesService';

export type {
    BusinessStaff,
    StaffCreateData
} from './staffService';
