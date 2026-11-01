"use client";

import { useState } from "react";
import { Field, InputOTP, toast } from "@semi/ui";

export default function InputOTPBasic() {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  return (
    <Field label="Mã xác thực" hint="Gửi tới số điện thoại ****321" error={error ? "Mã không đúng, thử lại." : undefined}>
      <InputOTP
        value={code}
        onChange={(v) => {
          setCode(v);
          setError(false);
        }}
        onComplete={(v) => (v === "123456" ? toast({ title: "Đã xác thực", tone: "success" }) : setError(true))}
        invalid={error}
      />
    </Field>
  );
}
