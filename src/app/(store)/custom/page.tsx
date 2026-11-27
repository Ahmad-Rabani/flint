import { getSession } from "@/lib/auth/session";
import { getCustomizationOptions } from "@/features/custom-orders/queries";
import { STYLE_CATALOG } from "@/features/custom-orders/catalog";
import { CustomDesignerWizard } from "@/features/custom-orders/components/custom-designer-wizard";

export default async function CustomPage() {
  const session = await getSession();

  // Load all options upfront; wizard filters client-side by product type
  const options = await getCustomizationOptions().catch(() => []);

  const initialSession = session
    ? { name: session.name, email: session.email }
    : null;

  return (
    <CustomDesignerWizard
      stylesMap={STYLE_CATALOG}
      options={options}
      initialSession={initialSession}
    />
  );
}
