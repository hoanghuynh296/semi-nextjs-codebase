import { LetterAvatar } from "@semi/ui";

export default function AvatarLetter() {
  return (
    <div className="flex items-center gap-3">
      <LetterAvatar name="Đặng Minh Anh" size="lg" />
      <LetterAvatar name="Hoàng Huỳnh" />
      <LetterAvatar name="ánh dương" size="sm" />
      <LetterAvatar name="" size="sm" />
    </div>
  );
}
