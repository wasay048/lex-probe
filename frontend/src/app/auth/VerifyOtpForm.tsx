import { useState } from "react";
import { useRouter } from "next/navigation";

export default function VerifyOtpForm({ email }: { email: string }) {
    const [otp, setOtp] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch("/api/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, otp }),
        });
        const data = await res.json();
        if (data.success) {
            router.push("/login");
        } else {
            setError(data.message || "Invalid OTP");
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "1.5rem",
                background: "linear-gradient(145deg, #ffffff, #f3f4f6)",
                padding: "2.5rem",
                borderRadius: "1.5rem",
                boxShadow:
                    "0 10px 25px rgba(0,0,0,0.1), 0 4px 10px rgba(0,0,0,0.05)",
                maxWidth: 380,
                margin: "3rem auto",
                fontFamily: "Inter, sans-serif",
            }}
        >
            <h2
                style={{
                    fontWeight: 700,
                    fontSize: "1.3rem",
                    color: "#1f2937",
                    textAlign: "center",
                }}
            >
                Enter the 6-digit OTP sent to your email
            </h2>

            <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]{6}"
                value={otp}
                onChange={(e) =>
                    setOtp(e.target.value.replace(/[^0-9]/g, ""))
                }
                placeholder="000000"
                required
                maxLength={6}
                style={{
                    padding: "0.9rem 1rem",
                    fontSize: "1.4rem",
                    border: "2px solid #e5e7eb",
                    borderRadius: "0.75rem",
                    outline: "none",
                    width: "100%",
                    textAlign: "center",
                    letterSpacing: "0.4em",
                    background: "#f9fafb",
                    color: "#111827",
                    transition: "all 0.25s ease-in-out",
                }}
                onFocus={(e) =>
                    (e.currentTarget.style.border = "2px solid #6366f1")
                }
                onBlur={(e) =>
                    (e.currentTarget.style.border = "2px solid #e5e7eb")
                }
            />

            <button
                type="submit"
                style={{
                    background:
                        "linear-gradient(90deg, #6366f1 0%, #3b82f6 100%)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "0.75rem",
                    padding: "0.85rem 2.5rem",
                    fontWeight: 700,
                    fontSize: "1.1rem",
                    cursor: "pointer",
                    boxShadow: "0 4px 15px rgba(99,102,241,0.3)",
                    transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseOver={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                        "0 6px 20px rgba(99,102,241,0.4)";
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                        "0 4px 15px rgba(99,102,241,0.3)";
                }}
            >
                Verify
            </button>

            {error && (
                <div
                    style={{
                        color: "#dc2626",
                        fontWeight: 600,
                        fontSize: "0.95rem",
                        marginTop: "-0.5rem",
                    }}
                >
                    {error}
                </div>
            )}
        </form>
    );
}
