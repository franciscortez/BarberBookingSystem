export interface Service {
    id: string;
    barber_id: string | null;
    name: string;
    description: string | null;
    total_price: string;
    downpayment_amount: string;
    duration_mins: number;
    created_at: Date | null;
    updated_at: Date | null;
}

export interface ServiceWithBarber extends Service {
    barber_name: string;
}

export interface CreateServiceInput {
    barber_id: string;
    name: string;
    description?: string;
    total_price: string;
    downpayment_amount: string;
    duration_mins: number;
}

export interface UpdateServiceInput {
    name?: string;
    description?: string;
    total_price?: string;
    downpayment_amount?: string;
    duration_mins?: number;
}
