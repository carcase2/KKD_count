"use client";

import { useEffect, useState } from "react";

/** 클라이언트에서만 location.hash 동기화 (네비 활성 상태용) */
export function useHash() {
  const [hash, setHash] = useState("");

  useEffect(() => {
    const sync = () => setHash(typeof window !== "undefined" ? window.location.hash : "");
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  return hash;
}
