export interface OccupiedSlot {
    start_time: string;
    end_time: string;
}

export interface ValidateBookableSlotInput {
    appointmentDate: string;
    startTime: string;
    durationMins: number | string;
    now?: Date;
}

export interface ValidationResult {
    valid: boolean;
    error?: string;
}
