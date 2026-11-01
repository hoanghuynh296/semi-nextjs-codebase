"use client";

import { useState } from "react";
import { Button, Field, Input, InputGroup } from "@semi/ui";

export default function InputGroupAddons() {
  const [show, setShow] = useState(false);
  return (
    <div className="grid gap-4 max-w-md">
      <Field label="Website">
        <InputGroup start="https://">
          <Input placeholder="3dnoobs.vn" />
        </InputGroup>
      </Field>
      <Field label="Giá bán">
        <InputGroup end="₫">
          <Input defaultValue="250.000" className="tabular-nums" />
        </InputGroup>
      </Field>
      <Field label="Mật khẩu Wi-Fi máy in">
        <InputGroup end={<Button size="sm" variant="ghost" iconOnly icon={show ? "eyeOff" : "eye"} aria-label={show ? "Ẩn" : "Hiện"} onClick={() => setShow((v) => !v)} />}>
          <Input type={show ? "text" : "password"} defaultValue="noobs-2026" />
        </InputGroup>
      </Field>
    </div>
  );
}
