import { getMerchantMappings } from "@/app/actions/merchant-mappings";
import { MerchantMappingsClient } from "./merchant-mappings-client";

export default async function MerchantMappingsPage() {
  const result = await getMerchantMappings();

  if (result.error) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-500">Error: {result.error}</div>
        </div>
      </div>
    );
  }

  return <MerchantMappingsClient initialMappings={result.mappings || []} />;
}
