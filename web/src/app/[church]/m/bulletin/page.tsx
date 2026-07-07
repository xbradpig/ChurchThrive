import ModulePage from "@/components/ModulePage";
import BulletinBoard from "./BulletinBoard";

export default function BulletinPage() {
  return (
    <ModulePage moduleKey="bulletin" title="전자주보">
      {({ canManage }) => <BulletinBoard canManage={canManage} />}
    </ModulePage>
  );
}
