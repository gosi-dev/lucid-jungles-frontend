import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { FaCaretRight } from "react-icons/fa";
import Link from "next/link";
import AnimatedPage from "../components/AnimatedPage";
import { useRecoverPasswordMutation } from "../store/apiAuth";

export default function ForgotPassword() {
  const router = useRouter();
  const [recoverPassword, { isLoading }] = useRecoverPasswordMutation();
  const [email, setEmail] = useState("");

  const handleSubmit = async () => {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    try {
      await recoverPassword({ email }).unwrap();
      toast.success("Recovery email sent", {
        description: "Check your inbox for a recovery token.",
      });
      setTimeout(() => router.push("/reset-password"), 2000);
    } catch (err) {
      // Return a generic message regardless of whether email exists
      toast.success("Recovery email sent", {
        description: "If that email is registered, a token has been sent.",
      });
      setTimeout(() => router.push("/reset-password"), 2000);
    }
  };

  return (
    <AnimatedPage>
      <Head>
        <title>Forgot Password — Lucid Jungles</title>
      </Head>
      <div className="w-[100dvw] h-[100dvh] bg-primary text-secondary p-10 flex flex-col items-center justify-center font-CodeSaver">
        <div className="w-full flex flex-col items-center gap-2 mb-10">
          <h1 className="text-xl md:text-2xl font-semibold uppercase tracking-widest">
            Reset Your Password
          </h1>
          <p className="text-sm opacity-60 text-center max-w-sm">
            Enter your email and we&apos;ll send you a recovery token.
          </p>
        </div>

        <div className="w-full flex flex-col items-center gap-6 md:gap-10">
          <div className="relative flex flex-col gap-1">
            <label htmlFor="email" className="uppercase font-semibold">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              className="w-full md:w-[520px] h-9 md:h-12 px-4 border border-secondary bg-transparent outline-none placeholder:text-secondary text-center text-sm md:text-base"
              placeholder="YOUR EMAIL ADDRESS _"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
        </div>

        <div className="h-10 md:h-12 w-full flex flex-row items-center justify-end gap-4 mt-10">
          <Link
            href="/signin"
            className="h-full w-max px-6 bg-primary hover:bg-secondary flex items-center transition-all ease-in-out duration-300 text-sm md:text-base whitespace-nowrap justify-center font-semibold text-secondary hover:text-primary border-[1.5px] border-secondary hover:border-primary"
          >
            BACK TO SIGN IN
          </Link>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="h-full text-sm md:text-base bg-secondary text-primary flex flex-row items-center gap-2 md:gap-4 px-4 md:px-6"
          >
            {isLoading ? "SENDING..." : "SEND TOKEN"}{" "}
            <FaCaretRight size={15} />
          </button>
        </div>
      </div>
    </AnimatedPage>
  );
}
