import { useState } from "react";
import { Button, Input, Modal, Table } from "../components/ui";

const users = [
  { id: "1", fullName: "Anh Tuấn", email: "anhtuan@gmail.com", role: "admin" },
  { id: "2", fullName: "Thanh Sang", email: "thangsang@gmail.com", role: "staff" },
];

const columns = [
  { key: "fullName", title: "Họ tên" },
  { key: "email", title: "Email" },
  {
    key: "role",
    title: "Vai trò",
    render: (record) => (
      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
        {record.role}
      </span>
    ),
  },
];

export default function UIComponentsDemo() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-8 p-6">
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Button</h2>
        <div className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="ghost">Ghost</Button>
          <Button loading>Loading</Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Input</h2>
        <div className="max-w-md space-y-4">
          <Input label="Email" placeholder="Nhập email" />
          <Input
            label="Mật khẩu"
            type="password"
            placeholder="Nhập mật khẩu"
            error="Mật khẩu không hợp lệ"
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Modal</h2>
        <Button onClick={() => setOpen(true)}>Mở modal</Button>

        <Modal open={open} onClose={() => setOpen(false)} title="Demo modaldasds">
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Đây là modal dùng chung cho toàn bộ hệ thống.
            </p>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Đóng
              </Button>
              <Button>Xác nhận</Button>
            </div>
          </div>
        </Modal>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Table</h2>
        <Table columns={columns} data={users} rowKey="id" />
      </section>
    </div>
  );
}