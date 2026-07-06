import ModulePage from "@/components/ModulePage";
import { redirect } from "next/navigation";
import NewcomerBoard from "./NewcomerBoard";

export default function NewcomerPage() {
  return (
    <ModulePage moduleKey="newcomer" title="새가족 관리">
      {({ canManage, role }) => {
        if (!canManage && role !== "superadmin" && role !== "pastor") redirect("/home");
        return <NewcomerBoard />;
      }}
    </ModulePage>
  );
}
