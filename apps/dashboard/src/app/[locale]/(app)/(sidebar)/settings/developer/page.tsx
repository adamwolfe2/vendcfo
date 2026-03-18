import { CreateApiKeyModal } from "@/components/modals/create-api-key-modal";
import { DeleteApiKeyModal } from "@/components/modals/delete-api-key-modal";
import { EditApiKeyModal } from "@/components/modals/edit-api-key-modal";
import { OAuthSecretModal } from "@/components/modals/oauth-secret-modal";
import { OAuthApplicationCreateSheet } from "@/components/sheets/oauth-application-create-sheet";
import { OAuthApplicationEditSheet } from "@/components/sheets/oauth-application-edit-sheet";
import { DataTable } from "@/components/tables/api-keys";
import { OAuthDataTable } from "@/components/tables/oauth-applications";
import { getQueryClient, trpc } from "@/trpc/server";
import { getServerCaller } from "@/trpc/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developer | VendCFO",
};

export default async function Page() {
  const queryClient = getQueryClient();

  try {
    const caller = await getServerCaller();

    const results = await Promise.allSettled([
      caller.apiKeys.get(),
      caller.oauthApplications.list(),
    ]);

    if (results[0].status === "fulfilled") {
      queryClient.setQueryData(
        trpc.apiKeys.get.queryOptions().queryKey,
        results[0].value,
      );
    }
    if (results[1].status === "fulfilled") {
      queryClient.setQueryData(
        trpc.oauthApplications.list.queryOptions().queryKey,
        results[1].value,
      );
    }
  } catch (error) {
    console.error("[DeveloperPage] Failed to prefetch via direct caller:", error);
  }

  return (
    <>
      <div className="space-y-12">
        <DataTable />
        <OAuthDataTable />
      </div>

      <EditApiKeyModal />
      <DeleteApiKeyModal />
      <CreateApiKeyModal />
      <OAuthSecretModal />
      <OAuthApplicationCreateSheet />
      <OAuthApplicationEditSheet />
    </>
  );
}
