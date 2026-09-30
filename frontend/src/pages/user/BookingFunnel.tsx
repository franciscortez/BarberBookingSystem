import { useBooking } from "../../hooks/useBooking";
import BookingSection from "../../sections/user/booking/BookingSection";
const BookingFunnel = () => <BookingSection {...useBooking()} />;
export default BookingFunnel;
