"use client";

import { useState } from "react";
import { Button, CustomSelect, Field, Modal, Popover } from "@semi/ui";

export default function ModalLayers() {
  const [open, setOpen] = useState(false);
  const [material, setMaterial] = useState("pla");
  return (
    <>
      <Button icon="sliders" onClick={() => setOpen(true)}>
        Chọn vật liệu
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Vật liệu in"
        footer={
          <Button size="modal" variant="primary" onClick={() => setOpen(false)}>
            Xong
          </Button>
        }
      >
        <Field label="Vật liệu">
          <CustomSelect
            variant="field"
            value={material}
            onChange={setMaterial}
            options={[
              { value: "pla", label: "PLA" },
              { value: "petg", label: "PETG" },
              { value: "abs", label: "ABS" },
            ]}
          />
        </Field>
        <Popover label="Nhiệt độ gợi ý" trigger={<Button>Nhiệt độ gợi ý</Button>}>
          <p className="text-label text-body">PLA 200–220 °C, PETG 230–250 °C.</p>
          <Button>Áp dụng</Button>
        </Popover>
      </Modal>
    </>
  );
}
