import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { setEmail } from "../store/registerSlice";
import { toast } from "sonner";
import { FaCaretRight } from "react-icons/fa";
import AnimatedPage from "../components/AnimatedPage";

export default function SignupEmail() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [email, setEmailVal] = useState("");

  const handleContinue = () => {
    if (email.length < 4 || !email.includes("@") || !email.includes(".")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    dispatch(setEmail(email));
    router.push("/signup-two");
  };

  return (
    <AnimatedPage>
      <Head>
        <title>Sign Up — Email</title>
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
              type="email"
              className="w-full md:w-[480px] h-9 md:h-12 px-4 border border-secondary bg-transparent outline-none placeholder:text-secondary placeholder:text-xs md:placeholder:text-base text-center text-sm md:text-base"
              placeholder="YOUR EMAIL ADDRESS _"
              value={email}
              onChange={(e) => setEmailVal(e.target.value)}
            />
          </div>
        </div>
        <div className="h-10 md:h-12 w-full flex flex-row items-center justify-end gap-4">
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
