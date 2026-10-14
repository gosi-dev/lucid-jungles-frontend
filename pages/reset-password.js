import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { FaCaretRight } from "react-icons/fa";
import { RxEyeOpen, RxEyeClosed } from "react-icons/rx";
import Link from "next/link";
import AnimatedPage from "../components/AnimatedPage";
import { useResetPasswordMutation } from "../store/apiAuth";

export default function ResetPassword() {
  const router = useRouter();
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const [recoveryToken, setRecoveryToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    if (!recoveryToken || !newPassword || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    try {
      await resetPassword({ recoveryToken, newPassword }).unwrap();
      toast.success("Password updated", {
        description: "You can now sign in with your new password.",
      });
      setTimeout(() => router.push("/signin"), 2000);
    } catch (err) {
      toast.error(err?.data?.message || "Invalid or expired token");
    }
  };

  return (
    <AnimatedPage>
      <Head>
        <title>Reset Password — Lucid Jungles</title>
      </Head>
      <div className="w-[100dvw] h-[100dvh] bg-primary text-secondary p-10 flex flex-col items-center justify-center font-CodeSaver">
        <div className="w-full flex flex-col items-center gap-2 mb-10">
          <h1 className="text-xl md:text-2xl font-semibold uppercase tracking-widest">
            Set New Password
          </h1>
          <p className="text-sm opacity-60 text-center max-w-sm">
            Enter the token from your email and choose a new password.
          </p>
        </div>

        <div className="w-full flex flex-col items-center gap-6 md:gap-8">
          <div className="relative flex flex-col gap-1">
            <label htmlFor="token" className="uppercase font-semibold">
              Recovery Token
            </label>
            <input
              id="token"
              type="text"
              className="w-full md:w-[520px] h-9 md:h-12 px-4 border border-secondary bg-transparent outline-none placeholder:text-secondary text-center text-sm md:text-base tracking-widest"
              placeholder="PASTE TOKEN FROM EMAIL _"
              value={recoveryToken}
              onChange={(e) => setRecoveryToken(e.target.value.trim())}
            />
          </div>

          <div className="relative flex flex-col gap-1">
            <label htmlFor="newPassword" className="uppercase font-semibold">
              New Password
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                className="w-full md:w-[520px] h-9 md:h-12 px-4 border border-secondary bg-transparent outline-none placeholder:text-secondary text-center text-sm md:text-base"
                placeholder="NEW PASSWORD _"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-secondary"
              >
                {showPassword ? <RxEyeOpen size={20} /> : <RxEyeClosed size={20} />}
              </button>
            </div>
          </div>

          <div className="relative flex flex-col gap-1">
            <label htmlFor="confirmPassword" className="uppercase font-semibold">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              className="w-full md:w-[520px] h-9 md:h-12 px-4 border border-secondary bg-transparent outline-none placeholder:text-secondary text-center text-sm md:text-base"
              placeholder="CONFIRM PASSWORD _"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
        </div>

        <div className="h-10 md:h-12 w-full flex flex-row items-center justify-end gap-4 mt-10">
          <Link
            href="/forgot-password"
            className="h-full w-max px-6 bg-primary hover:bg-secondary flex items-center transition-all ease-in-out duration-300 text-sm md:text-base whitespace-nowrap justify-center font-semibold text-secondary hover:text-primary border-[1.5px] border-secondary hover:border-primary"
          >
            RESEND TOKEN
          </Link>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="h-full text-sm md:text-base bg-secondary text-primary flex flex-row items-center gap-2 md:gap-4 px-4 md:px-6"
          >
            {isLoading ? "UPDATING..." : "UPDATE PASSWORD"}{" "}
            <FaCaretRight size={15} />
          </button>
        </div>
      </div>
    </AnimatedPage>
  );
}
