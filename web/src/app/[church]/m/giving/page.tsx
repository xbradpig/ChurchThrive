import ModulePage from "@/components/ModulePage";
import GivingBoard from "./GivingBoard";

export default function GivingPage() {
  return (
    <ModulePage moduleKey="giving" title="헌금 기록">
      {({ canManage }) => <GivingBoard canManage={canManage} />}
    </ModulePage>
  );
}
