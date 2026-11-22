"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field, FormActions, FormErrorSummary, Input, toast, useFormValidation, useUnsavedGuard } from "@semi/ui";

const EMPTY = { name: "", email: "", phone: "", price: "" };

export default function FormActionsPageForm() {
  const [values, setValues] = useState(EMPTY);
  const [saved, setSaved] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const set = (key: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) => setValues((v) => ({ ...v, [key]: e.target.value }));

  // errors show after a field loses focus, then follow every change
  const form = useFormValidation(values, {
    name: (v) => (v.trim() ? undefined : "Nhập tên máy in."),
    email: (v) => (/^\S+@\S+\.\S+$/.test(v) ? undefined : "Email chưa đúng, ví dụ ten@congty.vn."),
    phone: (v) => (v && !/^0\d{9}$/.test(v) ? "Số điện thoại gồm 10 số, bắt đầu bằng 0." : undefined),
  });
  // warns on reload, tab close, a link or back while this is true
  const dirty = JSON.stringify(values) !== JSON.stringify(saved);
  const { confirmLeave } = useUnsavedGuard(dirty);
  const router = useRouter();

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.validate()) return;
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(values); // not dirty any more: leaving does not ask
      toast({ title: "Đã tạo máy in", tone: "success" });
    }, 600);
  };

  return (
    <form data-form="page-form" onSubmit={save} noValidate className="w-full max-w-2xl flex flex-col gap-stack">
      <Field label="Tên máy in" required error={form.errors.name}>
        <Input value={values.name} onChange={set("name")} onBlur={form.blur("name")} />
      </Field>
      <Field label="Email liên hệ" kind="email" required error={form.errors.email}>
        <Input value={values.email} onChange={set("email")} onBlur={form.blur("email")} />
      </Field>
      <Field label="Số điện thoại" kind="tel" hint="Không bắt buộc." error={form.errors.phone}>
        <Input value={values.phone} onChange={set("phone")} onBlur={form.blur("phone")} />
      </Field>
      <Field label="Giá bán" kind="money">
        <Input value={values.price} onChange={set("price")} />
      </Field>
      <FormErrorSummary errors={form.errors} />
      <FormActions create loading={saving} onCancel={() => confirmLeave(() => router.back())} />
    </form>
  );
}
