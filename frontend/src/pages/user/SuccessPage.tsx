import { useBookingStatus } from "../../hooks/useBookingStatus";
import SuccessSection from "../../sections/user/success/SuccessSection";
const SuccessPage = () => <SuccessSection {...useBookingStatus()} />;
export default SuccessPage;
