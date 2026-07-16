import * as ServiceModel from '../model/service.model';
import { AppError } from '../utils/AppError';
import { Service, ServiceWithBarber, CreateServiceInput as DBCreateServiceInput, UpdateServiceInput as DBUpdateServiceInput } from '../types';
import { CreateServiceSchema, CreateServiceInput, UpdateServiceSchema, UpdateServiceInput } from '../validation/service.validation';

export { CreateServiceSchema, CreateServiceInput, UpdateServiceSchema, UpdateServiceInput };

export const listServices = async (barberId?: string): Promise<ServiceWithBarber[]> => {
    if (barberId) return ServiceModel.getServicesByBarber(barberId);
    return ServiceModel.getAllServices();
};

export const fetchService = async (id: string): Promise<Service> => {
    const service = await ServiceModel.getServiceById(id);
    if (!service) throw AppError.notFound('Service not found');
    return service;
};

export const createService = async (data: CreateServiceInput): Promise<Service> => {
    return ServiceModel.createService(data as unknown as DBCreateServiceInput);
};

export const updateService = async (id: string, data: UpdateServiceInput): Promise<Service> => {
    const updated = await ServiceModel.updateService(id, data as unknown as DBUpdateServiceInput);
    if (!updated) throw AppError.notFound('Service not found');
    return updated;
};


export const deleteService = async (id: string): Promise<void> => {
    const success = await ServiceModel.deleteService(id);
    if (!success) throw AppError.notFound('Service not found');
};
