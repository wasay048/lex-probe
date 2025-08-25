import { useState } from "react";
import VerifyOtpForm from "./VerifyOtpForm";

export default function OtpStep({ email }: { email: string }) {
    const [showOtp, setShowOtp] = useState(true);
    return showOtp ? <VerifyOtpForm email={email} /> : null;
}
