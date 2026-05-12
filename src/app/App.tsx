import { useState } from "react";
import { TooltipProvider } from "./components/ui/tooltip";
import { ObjectivesScreen } from "./components/objectives-screen";
import { AriaScreen } from "./components/aria-screen";
import { AmlDarkSkin, AriaFloatingButton, KpiMiniBar, UnifiedNav } from "./components/aml-shell";
import { ToastHost } from "./components/aml-interactions";

export default function App() {
  const [screen, setScreen] = useState<"objectives" | "aria">("objectives");

  if (screen === "aria") {
    return (
      <TooltipProvider delayDuration={150}>
        <AriaScreen currentScreen={screen} onSwitchScreen={setScreen} />
        <ToastHost />
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <AmlDarkSkin />
      <div className="aml-dark min-h-screen w-full">
        <UnifiedNav currentScreen={screen} onSwitchScreen={setScreen} />
        <KpiMiniBar />

        <main className="max-w-[1440px] mx-auto px-6 py-6 space-y-8">
          <ObjectivesScreen />
        </main>
        <AriaFloatingButton onClick={() => setScreen("aria")} hasAlert />
        <ToastHost />
      </div>
    </TooltipProvider>
  );
}
