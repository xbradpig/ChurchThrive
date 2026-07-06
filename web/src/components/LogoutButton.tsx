"use client";

import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  return (
    <button className="btn btn-ghost mt-2"
            onClick={async () => {
              await createClient().auth.signOut();
              window.location.href = "/login";
            }}>
      로그아웃
    </button>
  );
}
