import ModulePage from "@/components/ModulePage";
import NoticeBoard from "./NoticeBoard";

export default function NoticePage() {
  return (
    <ModulePage moduleKey="notice" title="공지·소통">
      {({ canManage }) => <NoticeBoard canManage={canManage} />}
    </ModulePage>
  );
}
