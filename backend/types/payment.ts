export interface Payment {
    id: string;
    appointment_id: string | null;
    paymongo_checkout_id: string | null;
    paymongo_payment_id: string | null;
    amount: string;
    status: string;
    idempotency_key: string;
    created_at: Date | null;
    updated_at: Date | null;
}

export interface CreatePaymentInput {
    appointment_id: string;
    amount: string;
    idempotency_key: string;
}

export interface UpdatePaymentInput {
    paymongo_checkout_id?: string;
    paymongo_payment_id?: string | null;
    status?: string;
}
