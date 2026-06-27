"use client";

import { useParams } from "next/navigation";
import { GeneratorWindow } from "@/components/generator/generator-window";

function GeneratorSessionPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;

  if (!sessionId) {
    return null;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <GeneratorWindow sessionId={sessionId} />
    </div>
  );
}

export default GeneratorSessionPage;
