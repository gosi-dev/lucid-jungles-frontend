import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { updateIsLoggedIn } from "../store/registerSlice";
import { useLoginMutation } from "../store/apiAuth";
import { toast } from "sonner";
import { RxEyeOpen, RxEyeClosed } from "react-icons/rx";
import { FaCaretRight } from "react-icons/fa";
import Link from "next/link";
import AnimatedPage from "../components/AnimatedPage";

export default function Signin() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      await login({ email, password }).unwrap();
      dispatch(updateIsLoggedIn(true));
      toast.success("Login Successful", {
        description: "Welcome home, Dreamer.",
      });
      // A gate that remembers where it interrupted — e.g. a half-finished ticket order.
      const next = typeof router.query.next === 'string' ? router.query.next : null;
      const destination = next && next.startsWith('/') ? next : "/kura";
      setTimeout(() => router.push(destination), 2000);
    } catch (err) {
      toast.error(err?.data?.message || "Login failed");
    }
  };

  return (
    <AnimatedPage>
      <Head>
        <title>Sign In — Lucid Jungles</title>
      </Head>
      <div className="w-[100dvw] h-[100dvh] bg-primary text-secondary p-10 flex flex-col items-center justify-center font-CodeSaver">
        <div className="w-full h-full flex flex-col items-center justify-center gap-6 md:gap-10">
          <div className="relative flex flex-col gap-1">
            <label htmlFor="email" className="uppercase font-semibold">
              Email Address
            </label>
            <input
              id="email"
              type="text"
              className="w-full md:w-[520px] h-9 md:h-12 px-4 border border-secondary bg-transparent outline-none placeholder:text-secondary text-center text-sm md:text-base"
              placeholder="YOUR EMAIL ADDRESS _"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="relative flex flex-col gap-1">
            <label htmlFor="password" className="uppercase font-semibold">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="w-full md:w-[520px] h-9 md:h-12 px-4 border border-secondary bg-transparent outline-none placeholder:text-secondary text-center text-sm md:text-base"
                placeholder="YOUR PASSWORD _"
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
          </div>
        </div>
        <div className="h-10 md:h-12 w-full flex flex-row items-center justify-end gap-4">
          <Link
            href="/forgot-password"
            className="h-full w-max px-4 flex items-center text-sm md:text-base whitespace-nowrap justify-center opacity-60 hover:opacity-100 transition-opacity"
          >
            FORGOT PASSWORD?
          </Link>
          <Link
            href="/signup"
            className="h-full w-max px-6 bg-primary hover:bg-secondary flex items-center transition-all ease-in-out duration-300 text-sm md:text-base whitespace-nowrap justify-center font-semibold text-secondary hover:text-primary border-[1.5px] border-secondary hover:border-primary"
          >
            CREATE ACCOUNT
          </Link>
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="h-full text-sm md:text-base bg-secondary text-primary flex flex-row items-center gap-2 md:gap-4 px-4 md:px-6"
          >
            {isLoading ? "SIGNING IN..." : "SIGN IN"}{" "}
            <FaCaretRight size={15} />
          </button>
        </div>
      </div>
    </AnimatedPage>
  );
}
