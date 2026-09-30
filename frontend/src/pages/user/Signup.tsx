import { useAuthForm } from "../../hooks/useAuthForm";
import AuthSection from "../../sections/user/auth/AuthSection";
const Signup = () => <AuthSection {...useAuthForm("signup")} />;
export default Signup;
