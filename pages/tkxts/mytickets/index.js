// pages/tkxts/mytickets/index.js
import { useRouter } from 'next/router';
import { useEffect } from 'react';
export default function MyTickets() {
  const router = useRouter();
  useEffect(() => { router.replace('/tkxts'); }, []);
  return null;
}
