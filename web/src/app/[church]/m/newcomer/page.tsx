import ModulePage from "@/components/ModulePage";
import { redirect } from "next/navigation";
import NewcomerBoard from "./NewcomerBoard";

export default async function NewcomerPage({ params }: { params: Promise<{ church: string }> }) {
  const { church } = await params;
  return (
    <ModulePage moduleKey="newcomer" title="새가족 관리">
      {({ canManage, role }) => {
        if (!canManage && role !== "superadmin" && role !== "pastor") redirect(`/${church}/home`);
        return <NewcomerBoard />;
      }}
    </ModulePage>
  );
}
