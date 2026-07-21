import {
    createService, getServices, getServicesByProvider, getService,
    updateService, deleteService, updateServiceStatus, getAdminServices
} from './crud';
import {
    getServiceTypes, getServiceBrands, getServiceModels, getServiceModel,
    updateServiceModel, getServicesByModel
} from './catalog';
import {
    requestServiceUpdate, getPendingServiceEdits, getServiceEditsByService,
    getMyPendingEdits, getServiceEdit, deleteServiceEdit,
    approveServiceEdit, rejectServiceEdit
} from './edits';

export const servicesService = {
    // CRUD
    createService,
    getServices,
    getServicesByProvider,
    getService,
    updateService,
    deleteService,
    updateServiceStatus,
    approveService: (id: string) => updateServiceStatus(id, 'approved'),
    getAdminServices,

    // Catalog
    getServiceTypes,
    getServiceBrands,
    getServiceModels,
    getServiceModel,
    updateServiceModel,
    getServicesByModel,

    // Edits workflow
    requestServiceUpdate,
    getPendingServiceEdits,
    getServiceEditsByService,
    getMyPendingEdits,
    getServiceEdit,
    deleteServiceEdit,
    approveServiceEdit,
    rejectServiceEdit,
};
