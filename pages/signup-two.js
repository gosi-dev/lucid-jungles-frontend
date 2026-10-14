import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { useRegisterMutation } from "../store/apiAuth";
import { toast } from "sonner";
import { RxEyeOpen, RxEyeClosed } from "react-icons/rx";
import { FaCaretRight } from "react-icons/fa";
import AnimatedPage from "../components/AnimatedPage";

export default function SignupTwo() {
  const router = useRouter();
  const { username, email } = useSelector((state) => state.registerSlice);
  const [register, { isLoading }] = useRegisterMutation();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async () => {
    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      await register({ username, email, password }).unwrap();
      toast.success("Account created!");
      router.push("/signup-three");
    } catch (err) {
      toast.error(err?.data?.message || "Registration failed");
    }
  };

  return (
    <AnimatedPage>
      <Head>
        <title>Sign Up — Password</title>
      </Head>
      <div className="w-[100dvw] h-[100dvh] bg-primary text-secondary p-10 flex flex-col items-center justify-center font-CodeSaver">
        <div className="w-full h-full flex flex-col items-center justify-center gap-10">
          <p className="p-4 md:p-7 px-8 md:px-12 text-xs md:text-lg bg-secondary text-primary uppercase max-w-[600px] text-center">
            LEAVE A WORD Phrase OR COMBO THAT ONLY YOU
            <br className="hidden md:block" />
            WILL REMEMBER FOR WHEN YOU NEED a path back
            <br />
            into your jungle
          </p>
          <div className="relative h-9 md:h-12">
            <input
              type={showPassword ? "text" : "password"}
              className="w-full md:w-[380px] h-full px-4 border border-secondary bg-transparent outline-none placeholder:text-secondary placeholder:text-xs md:placeholder:text-base text-center text-sm md:text-base"
              placeholder="PASS WORD _"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-secondary"
            >
              {showPassword ? (
                <RxEyeOpen size={20} />
              ) : (
                <RxEyeClosed size={20} />
              )}
            </button>
          </div>
          <div className="relative h-9 md:h-12">
            <input
              type={showConfirm ? "text" : "password"}
              className="w-full md:w-[380px] h-full px-4 border border-secondary bg-transparent outline-none placeholder:text-secondary placeholder:text-xs md:placeholder:text-base text-center text-sm md:text-base"
              placeholder="CONFIRM PASSWORD _"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-secondary"
            >
              {showConfirm ? (
                <RxEyeOpen size={20} />
              ) : (
                <RxEyeClosed size={20} />
              )}
            </button>
          </div>
        </div>
        <div className="h-10 md:h-12 w-full flex flex-row items-center justify-end gap-4">
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="h-full text-sm md:text-base bg-secondary text-primary flex flex-row items-center gap-2 md:gap-4 px-4 md:px-6"
          >
            {isLoading ? "CREATING..." : "CONTINUE"}{" "}
            <FaCaretRight size={15} />
          </button>
        </div>
      </div>
    </AnimatedPage>
  );
}
