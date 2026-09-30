import FormField from "../common/FormField";

interface Props {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  errors?: Record<string, string>;
  onChangeName: (value: string) => void;
  onChangeEmail: (value: string) => void;
  onChangePhone: (value: string) => void;
}
const ContactStep = (props: Props) => (
  <div className="booking-step">
    <h2 id="booking-step-heading" tabIndex={-1} className="booking-step-title">
      Your contact details
    </h2>
    <p className="task-muted">
      We use these details for your appointment and email management links. No
      account is required.
    </p>
    <div className="task-form booking-contact">
      <FormField
        id="contact-name"
        name="customer_name"
        label="Full name"
        autoComplete="name"
        required
        maxLength={255}
        value={props.customerName}
        error={props.errors?.name}
        onChange={(event) => props.onChangeName(event.target.value)}
      />
      <FormField
        id="contact-email"
        name="customer_email"
        label="Email address"
        type="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        required
        value={props.customerEmail}
        error={props.errors?.email}
        help="Check this address carefully. Your management links will be sent here."
        onChange={(event) => props.onChangeEmail(event.target.value)}
      />
      <FormField
        id="contact-phone"
        name="customer_phone"
        label="Phone number"
        type="tel"
        autoComplete="tel"
        required
        maxLength={50}
        value={props.customerPhone}
        error={props.errors?.phone}
        onChange={(event) => props.onChangePhone(event.target.value)}
      />
    </div>
  </div>
);
export default ContactStep;
