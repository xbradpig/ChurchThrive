import ModulePage from "@/components/ModulePage";
import NoteBoard from "./NoteBoard";

export default function NotePage() {
  return (
    <ModulePage moduleKey="note" title="말씀노트">
      {() => <NoteBoard />}
    </ModulePage>
  );
}
