export interface Appointment {
    id: string;
    customer_name: string;
    customer_phone: string;
    customer_email: string;
    barber_id: string | null;
    service_id: string | null;
    appointment_date: string;
    start_time: string;
    end_time: string;
    status: string;
    management_token: string;
    created_at: Date | null;
    updated_at: Date | null;
}

export interface AppointmentDetails extends Appointment {
    barber_name: string;
    service_name: string;
    total_price: string;
    downpayment_amount: string;
    payment_reference_number: string | null;
    paymongo_checkout_id: string | null;
    paymongo_payment_id: string | null;
}

export interface CreateAppointmentInput {
    customer_name: string;
    customer_phone: string;
    customer_email: string;
    barber_id: string;
    service_id: string;
    appointment_date: string;
    start_time: string;
    end_time: string;
    management_token: string;
}

export interface RescheduleScheduleInput {
    appointment_date: string;
    start_time: string;
    end_time: string;
}

export interface EmailAppointmentDetails {
    customer_email: string;
    customer_name: string;
    barber_name: string;
    service_name: string;
    appointment_date: string;
    start_time: string;
    payment_reference_number?: string | null;
    management_token: string;
}
