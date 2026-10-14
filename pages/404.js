// pages/404.js — Not Found
//
// The screen itself lives in components/NotFoundScreen.jsx, because the dynamic
// /[username] route needs to render the same thing when a base doesn't exist.

import NotFoundScreen from "../components/NotFoundScreen";

export default function NotFound() {
  return <NotFoundScreen />;
}

