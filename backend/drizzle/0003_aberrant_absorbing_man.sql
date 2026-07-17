CREATE INDEX IF NOT EXISTS "appointments_barber_date_idx" ON "appointments" USING btree ("barber_id","appointment_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "appointments_user_id_idx" ON "appointments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "appointments_status_idx" ON "appointments" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "appointments_management_token_idx" ON "appointments" USING btree ("management_token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "auth_sessions_user_id_idx" ON "auth_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "barber_blocks_barber_date_idx" ON "barber_availability_blocks" USING btree ("barber_id","block_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "barber_invitations_email_idx" ON "barber_invitations" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "barbers_user_id_idx" ON "barbers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "barbers_is_active_idx" ON "barbers" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_appointment_id_idx" ON "payments" USING btree ("appointment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_paymongo_checkout_idx" ON "payments" USING btree ("paymongo_checkout_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "payments_idempotency_key_idx" ON "payments" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "refresh_tokens_user_id_idx" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "refresh_tokens_session_id_idx" ON "refresh_tokens" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "services_barber_id_idx" ON "services" USING btree ("barber_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "services_is_active_idx" ON "services" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users" USING btree ("role");