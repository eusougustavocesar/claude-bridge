"use client";

import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Page, PageHeader } from "@/components/layout/page";
import { api } from "@/lib/api";
import { CONFIG_SCHEMA, KNOWN_KEYS, type FieldMeta } from "@/lib/config-schema";

export default function ConfigPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { values } = await api.config();
        if (!cancelled) {
          setValues(values);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function setField(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      // Only send known keys to avoid clobbering unknown ones
      const payload: Record<string, string> = {};
      for (const k of KNOWN_KEYS) {
        if (k in values) payload[k] = values[k];
      }
      const res = await api.saveConfig(payload);
      toast.success(
        res.note ??
          ".env saved. Restart the daemon for changes to take effect."
      );
    } catch (e) {
      toast.error(`Save failed: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Page>
        <PageHeader title="Configuration" />
        <div className="text-muted-foreground text-sm">Loading config…</div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page>
        <PageHeader title="Configuration" />
        <div className="p-6 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive text-sm font-mono">
          {error}
        </div>
      </Page>
    );
  }

  const unknownKeys = Object.keys(values).filter((k) => !KNOWN_KEYS.has(k));

  return (
    <Page>
      {/* PageHeader stays at the Page's full 5xl width so the H1 and Save
          button sit in the same column as other pages' headers */}
      <PageHeader
        title="Configuration"
        description={
          <>
            Edit <code className="font-mono text-xs">.env</code>. Changes
            apply after a daemon restart.
          </>
        }
        actions={
          <Button
            type="submit"
            form="config-form"
            disabled={saving}
            size="sm"
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        }
      />

      <form
        id="config-form"
        onSubmit={onSubmit}
        className="flex flex-col gap-6"
      >
      {CONFIG_SCHEMA.map((group) => (
        <Card key={group.id}>
          <CardHeader>
            <CardTitle className="text-base">{group.title}</CardTitle>
            <CardDescription>{group.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {group.fields.map((field, idx) => (
              <Field
                key={field.key}
                field={field}
                value={values[field.key] ?? ""}
                onChange={(v) => setField(field.key, v)}
                separator={idx > 0}
              />
            ))}
          </CardContent>
        </Card>
      ))}

      {unknownKeys.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Other env keys</CardTitle>
            <CardDescription>
              Keys present in <code className="font-mono text-xs">.env</code>{" "}
              that aren't managed by the UI. Saving won't touch them.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="font-mono text-xs space-y-1 text-muted-foreground">
              {unknownKeys.map((k) => (
                <li key={k}>
                  {k}={values[k]}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <footer className="flex items-center justify-between border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">
          Writing to{" "}
          <code className="font-mono">{"~/reverb/.env"}</code> —
          comments are preserved.
        </p>
        <Button type="submit" disabled={saving} size="sm">
          {saving ? "Saving…" : "Save"}
        </Button>
      </footer>
      </form>
    </Page>
  );
}

function Field({
  field,
  value,
  onChange,
  separator,
}: {
  field: FieldMeta;
  value: string;
  onChange: (v: string) => void;
  separator: boolean;
}) {
  return (
    <div>
      {separator ? <Separator className="mb-5" /> : null}
      <div className="grid md:grid-cols-[200px_1fr] gap-3 md:gap-4 items-start">
        <div className="flex flex-col gap-1">
          <Label htmlFor={field.key} className="text-sm font-medium">
            {field.label}
          </Label>
          <code className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            {field.key}
          </code>
        </div>
        <div className="flex flex-col gap-2">
          {field.type === "select" ? (
            <select
              id={field.key}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="h-8 px-3 rounded-md border border-input bg-background text-sm font-mono"
            >
              <option value="">—</option>
              {field.options?.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          ) : field.type === "textarea" ? (
            <textarea
              id={field.key}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={field.placeholder}
              rows={3}
              className="px-3 py-2 rounded-md border border-input bg-background text-sm font-mono resize-y"
            />
          ) : (
            <Input
              id={field.key}
              type={field.type === "number" ? "number" : "text"}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={field.placeholder}
              className="font-mono"
            />
          )}
          <p className="text-xs text-muted-foreground">{field.help}</p>
        </div>
      </div>
    </div>
  );
}
