import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";

export function MultiEmailInput({ value, onChange, label = "Correos Empresa", placeholder = "Ingrese correo y presione Enter o +", id = "correoEmpresa" }) {
  const [input, setInput] = useState("");
  const [emails, setEmails] = useState(Array.isArray(value) ? value : value ? [value] : []);

  const isValidEmail = (email) => {
    // Simple email regex
    return /.+@.+\..+/.test(email);
  };

  const addEmail = () => {
    const email = input.trim();
    if (email && isValidEmail(email) && !emails.includes(email)) {
      const newEmails = [...emails, email];
      setEmails(newEmails);
      setInput("");
      onChange(newEmails);
    }
  };

  const removeEmail = (email) => {
    const newEmails = emails.filter((e) => e !== email);
    setEmails(newEmails);
    onChange(newEmails);
  };

  const handleKeyDown = (e) => {
    if ((e.key === "Enter" || e.key === ",") && input) {
      e.preventDefault();
      addEmail();
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Input
          id={id}
          type="email"
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1"
        />
        <Button type="button" variant="outline" onClick={addEmail} disabled={!isValidEmail(input)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {emails.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-md">
          {emails.map((email, idx) => (
            <Badge key={idx} variant="secondary" className="flex items-center gap-1">
              {email}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeEmail(email)} />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
