import ModulePage from "@/components/ModulePage";
import TrainingBoard from "./TrainingBoard";

export default function TrainingPage() {
  return (
    <ModulePage moduleKey="training" title="훈련·교육">
      {({ canManage, isAdmin }) => <TrainingBoard canManage={canManage} isAdmin={isAdmin} />}
    </ModulePage>
  );
}
