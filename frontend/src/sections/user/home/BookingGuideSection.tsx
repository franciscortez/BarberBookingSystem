const BookingGuideSection = () => (
  <section
    className="landing-section landing-container landing-guide"
    aria-labelledby="booking-guide-title"
  >
    <div className="landing-section-heading">
      <h2 id="booking-guide-title">
        A few steps.
        <br />
        Then it’s your time.
      </h2>
      <p>
        No account required. Pick what works for you and reserve your
        appointment online.
      </p>
    </div>
    <ol className="landing-booking-steps">
      <li>
        <span className="landing-step-number" aria-hidden="true">
          01
        </span>
        <div>
          <h3>Choose your barber & service</h3>
          <p>Compare services, prices, and downpayments before you choose.</p>
        </div>
      </li>
      <li>
        <span className="landing-step-number" aria-hidden="true">
          02
        </span>
        <div>
          <h3>Find your date & time</h3>
          <p>
            Choose from available appointment times for your selected service.
          </p>
        </div>
      </li>
      <li>
        <span className="landing-step-number" aria-hidden="true">
          03
        </span>
        <div>
          <h3>Add your contact details</h3>
          <p>
            Tell us where to send your booking confirmation and management
            links.
          </p>
        </div>
      </li>
      <li>
        <span className="landing-step-number" aria-hidden="true">
          04
        </span>
        <div>
          <h3>Review & pay the downpayment</h3>
          <p>
            Complete checkout to secure your appointment. Use your email links
            to manage your booking.
          </p>
        </div>
      </li>
    </ol>
  </section>
);

export default BookingGuideSection;
