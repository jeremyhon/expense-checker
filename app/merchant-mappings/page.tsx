import { getMerchantMappings } from "@/app/actions/merchant-mappings";
import { MerchantMappingsClient } from "./merchant-mappings-client";

export default async function MerchantMappingsPage() {
  const result = await getMerchantMappings();

  if (result.error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-500">Error: {result.error}</div>
        </div>
      </div>
    );
  }

  return <MerchantMappingsClient initialMappings={result.mappings || []} />;
}
