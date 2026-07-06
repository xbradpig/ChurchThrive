import ModulePage from "@/components/ModulePage";
import VisitBoard from "./VisitBoard";

export default function VisitationPage() {
  return (
    <ModulePage moduleKey="visitation" title="심방">
      {({ canManage }) => <VisitBoard canManage={canManage} />}
    </ModulePage>
  );
}
