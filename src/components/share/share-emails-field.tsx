import { Form } from "@/ui/Form";

export function ShareEmailsField() {
  return (
    <div className="share-credential">
      <Form.Textarea
        label="Emails"
        name="emails"
        placeholder={"ada@example.com\ngrace@example.com"}
        rows={4}
      />
    </div>
  );
}
