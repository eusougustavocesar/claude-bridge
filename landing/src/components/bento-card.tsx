import { Card, CardContent } from "@/components/ui/card";

export function BentoCard({
  title,
  body,
  colSpan = 1,
  children,
}: {
  title: string;
  body: string;
  colSpan?: 1 | 2;
  children?: React.ReactNode;
}) {
  return (
    <Card className={`bg-card/40 overflow-hidden ${colSpan === 2 ? "sm:col-span-2" : ""}`}>
      <CardContent className="flex flex-col gap-3 p-6 h-full">
        <h3 className="font-semibold text-base">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed flex-1">{body}</p>
        {children ? <div className="mt-auto">{children}</div> : null}
      </CardContent>
    </Card>
  );
}
