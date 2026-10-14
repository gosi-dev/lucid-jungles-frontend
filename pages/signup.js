import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { setUsername } from "../store/registerSlice";
import { useValidateUsernameMutation } from "../store/apiAuth";
import { toast } from "sonner";
import { FaCaretRight } from "react-icons/fa";
import AnimatedPage from "../components/AnimatedPage";
import Link from "next/link";

export default function Signup() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { username: storedUsername } = useSelector(
    (state) => state.registerSlice
  );

  const [name, setName] = useState(storedUsername || "");
  const [isAvailable, setIsAvailable] = useState(null);
  const [checking, setChecking] = useState(false);

  const [validateUsername] = useValidateUsernameMutation();

  useEffect(() => {
    if (name.length < 4) {
      setIsAvailable(null);
      return;
    }
    setChecking(true);
    const timeout = setTimeout(async () => {
      try {
        const result = await validateUsername({ username: name }).unwrap();
        setIsAvailable(result.status !== false);
      } catch {
        setIsAvailable(false);
      } finally {
        setChecking(false);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [name, validateUsername]);

  const handleContinue = () => {
    if (!name || name.length < 4) {
      toast.error("Username must be at least 4 characters");
      return;
    }
    if (isAvailable === false) {
      toast.error("Username is taken");
      return;
    }
    dispatch(setUsername(name));
    router.push("/signup-email");
  };

  return (
    <AnimatedPage>
      <Head>
        <title>Sign Up — Lucid Jungles</title>
      </Head>
      <div className="w-[100dvw] h-[100dvh] bg-primary text-secondary p-10 flex flex-col items-center justify-center font-CodeSaver">
        <div className="w-full h-full flex flex-col items-center justify-center gap-6 md:gap-10">
          <p className="p-6 bg-secondary text-xs md:text-lg text-primary uppercase max-w-[600px] text-center">
            WELCOME to your personalized dream chamber. GLAD YOUVE DECIDED TO
            BEGIN YOUR Jungle JOURNEY.
            <br />
            What should we call you?
          </p>
          <div className="relative">
            <input
              type="text"
              className="w-full md:w-[480px] h-9 md:h-12 px-4 border border-secondary bg-transparent outline-none placeholder:text-secondary placeholder:text-xs md:placeholder:text-base text-center text-sm md:text-base mb-1"
              placeholder="YOUR NAME _"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {checking && (
              <p className="text-secondary/60 text-xs mt-1 text-center">
                Checking...
              </p>
            )}
            {!checking && isAvailable === true && (
              <p className="text-green-300 text-xs mt-1 text-center">
                Username is Available.
              </p>
            )}
            {!checking && isAvailable === false && (
              <p className="text-red-400 text-xs mt-1 text-center">
                Username is Unvailable.
              </p>
            )}
          </div>
        </div>
        <div className="h-10 md:h-12 w-full flex flex-row items-center justify-end gap-4">
          <Link
            href="/"
            className="h-full w-max px-6 bg-primary hover:bg-secondary flex items-center transition-all ease-in-out duration-300 text-sm md:text-base whitespace-nowrap justify-center font-semibold text-secondary hover:text-primary border-[1.5px] border-secondary hover:border-primary"
          >
            EXPLORE AS GUEST
          </Link>
          <button
            onClick={handleContinue}
            className="h-full text-sm md:text-base bg-secondary text-primary flex flex-row items-center gap-2 md:gap-4 px-4 md:px-6"
          >
            CONTINUE <FaCaretRight size={15} />
          </button>
        </div>
      </div>
    </AnimatedPage>
  );
}
