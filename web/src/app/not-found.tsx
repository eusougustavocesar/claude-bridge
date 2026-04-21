import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Page, PageHeader } from "@/components/layout/page";
import { EmptyState } from "@/components/empty-state";

export default function NotFound() {
  return (
    <Page>
      <PageHeader title="Page not found" />
      <EmptyState
        title="This route doesn't exist in the admin UI"
        description="Only /, /pair, /config, and /logs are served."
        icon={<span className="text-xl">404</span>}
        action={
          <Link href="/" className={buttonVariants({ size: "sm" })}>
            Back to dashboard
          </Link>
        }
      />
    </Page>
  );
}
