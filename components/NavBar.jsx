import { useState } from "react";
import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";
import { updateIsLoggedIn } from "../store/registerSlice";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { FaCaretDown } from "react-icons/fa";

export default function NavBar({ audioControls = false, theme = "default" }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isLoggedIn, username } = useSelector((state) => state.registerSlice);

  const moj = theme === "moj";

  return (
    <div
      className={`fixed z-50 top-0 pt-6 pb-2 left-0 w-full h-max px-[2.75dvw] flex flex-row items-center justify-between font-CodeSaver pointer-events-none ${
        audioControls
          ? moj
            ? "bg-[linear-gradient(to_bottom,_#151413_0%,_#151413_40%,_#15141300_100%)]"
            : "bg-[linear-gradient(to_bottom,_#02a1fd_0%,_#02a1fd_40%,_#02a1fd00_100%)]"
          : ""
      }`}
    >
      <img
        src="/assets/LOGO.svg"
        alt="LOGO"
        className="h-auto w-[70px] md:w-[120px] pointer-events-auto cursor-pointer"
        onClick={() => router.push("/")}
      />

      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          className={`w-[150px] md:w-[250px] pointer-events-auto h-8 md:h-10 mr-2 md:mr-0 flex flex-row items-center justify-between px-3 border-[1.5px] ${
            moj
              ? "bg-[#151413] border-[#ABD49E] text-[#ABD49E] hover:text-[#151413] hover:bg-[#ABD49E] data-[state=open]:border-[#ABD49E]"
              : "bg-secondary border-primary text-primary hover:text-white hover:bg-primary data-[state=open]:border-secondary"
          }`}
        >
          <p className="text-sm md:text-base">MENU</p>
          <FaCaretDown aria-hidden="true" size={12.5} />
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content className="w-[150px] md:w-[250px] pointer-events-auto p-0 pt-1 m-0 border-none bg-transparent shadow-none z-[9999]">
            <DropdownMenu.Item
              onSelect={() => router.push("/jungle")}
              className={`w-full mb-2 h-8 md:h-10 border-[1.5px] text-sm md:text-base font-CodeSaver cursor-pointer flex items-center px-3 outline-none ${
                moj
                  ? "!bg-[#151413] border-[#ABD49E] text-[#ABD49E]"
                  : "!bg-primary border-secondary text-secondary"
              }`}
            >
              JUNGLE MAP
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={() => router.push(isLoggedIn ? "/kura" : "/signup")}
              className={`w-full mb-2 h-8 md:h-10 border-[1.5px] text-sm md:text-base font-CodeSaver cursor-pointer flex items-center px-3 outline-none ${
                moj
                  ? "!bg-[#151413] border-[#ABD49E] text-[#ABD49E]"
                  : "!bg-primary border-secondary text-secondary"
              }`}
            >
              YOUR KURA
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={() => router.push(isLoggedIn ? "/dojo" : "/signup")}
              className={`w-full mb-2 h-8 md:h-10 border-[1.5px] text-sm md:text-base font-CodeSaver cursor-pointer flex items-center px-3 outline-none ${
                moj
                  ? "!bg-[#151413] border-[#ABD49E] text-[#ABD49E]"
                  : "!bg-primary border-secondary text-secondary"
              }`}
            >
              THE DOJO
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={() => router.push("/fanbase")}
              className={`w-full mb-2 h-8 md:h-10 border-[1.5px] text-sm md:text-base font-CodeSaver cursor-pointer flex items-center px-3 outline-none ${
                moj
                  ? "!bg-[#151413] border-[#ABD49E] text-[#ABD49E]"
                  : "!bg-primary border-secondary text-secondary"
              }`}
            >
              FANBASES
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={() => router.push("/store")}
              className={`w-full mb-2 h-8 md:h-10 border-[1.5px] text-sm md:text-base font-CodeSaver cursor-pointer flex items-center px-3 outline-none ${
                moj
                  ? "!bg-[#151413] border-[#ABD49E] text-[#ABD49E]"
                  : "!bg-primary border-secondary text-secondary"
              }`}
            >
              THE STORE
            </DropdownMenu.Item>
            {isLoggedIn && (
              <DropdownMenu.Item
                onSelect={() => router.push(`/profile/${username}`)}
                className={`w-full mb-2 h-8 md:h-10 border-[1.5px] text-sm md:text-base font-CodeSaver cursor-pointer flex items-center px-3 outline-none ${
                  moj
                    ? "!bg-[#151413] border-[#ABD49E] text-[#ABD49E]"
                    : "!bg-primary border-secondary text-secondary"
                }`}
              >
                MY PROFILE
              </DropdownMenu.Item>
            )}
            <DropdownMenu.Item
              onSelect={() => router.push("/about-us")}
              className={`w-full mb-2 h-8 md:h-10 border-[1.5px] text-sm md:text-base font-CodeSaver cursor-pointer flex items-center px-3 outline-none ${
                moj
                  ? "!bg-[#151413] border-[#ABD49E] text-[#ABD49E]"
                  : "!bg-primary border-secondary text-secondary"
              }`}
            >
              ABOUT US
            </DropdownMenu.Item>
            {router.pathname === "/kura" ? (
              <DropdownMenu.Item
                onSelect={() => {
                  dispatch(updateIsLoggedIn(false));
                  router.push("/");
                }}
                className={`w-full mb-2 h-8 md:h-10 border-[1.5px] text-sm md:text-base font-CodeSaver cursor-pointer flex items-center px-3 outline-none ${
                  moj
                    ? "!bg-[#151413] border-[#ABD49E] text-[#ABD49E]"
                    : "!bg-primary border-secondary text-secondary"
                }`}
              >
                LOG OUT
              </DropdownMenu.Item>
            ) : (
              <DropdownMenu.Item
                onSelect={() => {
                  dispatch(updateIsLoggedIn(false));
                  router.push("/signin");
                }}
                className={`w-full mb-2 h-8 md:h-10 border-[1.5px] text-sm md:text-base font-CodeSaver cursor-pointer flex items-center px-3 outline-none ${
                  moj
                    ? "!bg-[#151413] border-[#ABD49E] text-[#ABD49E]"
                    : "!bg-primary border-secondary text-secondary"
                }`}
              >
                SIGN IN
              </DropdownMenu.Item>
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}
