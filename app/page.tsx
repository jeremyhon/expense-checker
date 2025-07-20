import { Suspense } from "react";
import { Dashboard } from "@/components/dashboard";

export default function HomePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Dashboard />
    </Suspense>
  );
}
