import { useEffect, useState } from "react";
import Head from "next/head";
import { useSelector, useDispatch } from "react-redux";
import { updateIsLoggedIn } from "../store/registerSlice";
import { FaCaretRight } from "react-icons/fa";
import AnimatedPage from "../components/AnimatedPage";
import Link from "next/link";

export default function SignupThree() {
  const dispatch = useDispatch();
  const { username } = useSelector((state) => state.registerSlice);
  const [jfcId, setJfcId] = useState(null);

  useEffect(() => {
    dispatch(updateIsLoggedIn(true));
    // Fetch the Jungle Fight Club fanbase ID for onboarding CTA
    fetch('/api/fanbase/fetch_all')
      .then((r) => r.json())
      .then((d) => {
        if (d.status && Array.isArray(d.data)) {
          const jfc = d.data.find((f) => f.fanbaseType === 'fitness' && f.name === 'Jungle Fight Club');
          if (jfc) setJfcId(jfc._id);
        }
      })
      .catch(() => {});
  }, [dispatch]);

  return (
    <AnimatedPage>
      <Head>
        <title>Welcome — Lucid Jungles</title>
      </Head>
      <div className="w-[100dvw] h-[100dvh] bg-primary text-secondary p-10 flex flex-col items-center justify-center font-CodeSaver">
        <div className="w-full h-full flex flex-col items-center justify-center gap-10">
          <p className="p-6 bg-secondary text-xs md:text-lg text-primary uppercase max-w-[600px] text-center">
            A VERIFICATION EMAIL WILL BE SENT TO YOU SHORTLY, PLEASE CHECK IT
            OUT AND ACCEPT IT. I THINK WERE ALL SET {username}!
          </p>
          {jfcId && (
            <Link
              href={`/dojo/onboarding?fanbaseId=${jfcId}`}
              className="text-xs md:text-sm text-secondary underline underline-offset-4 opacity-70 hover:opacity-100"
              style={{ letterSpacing: '0.1em' }}
            >
              SET UP YOUR DOJO →
            </Link>
          )}
        </div>
        <div className="h-10 md:h-12 w-full flex flex-row items-center justify-end gap-4">
          <Link
            href="/kura"
            className="h-full text-sm md:text-base bg-secondary text-primary flex flex-row items-center gap-2 md:gap-4 px-4 md:px-6"
          >
            FINISH <FaCaretRight size={15} />
          </Link>
        </div>
      </div>
    </AnimatedPage>
  );
}
