// THROWAWAY PROTOTYPE route — sidebar layout variants preview.
// Sub-shape B: dashboard layouts can't read searchParams, so variants
// can't mount on live routes; they preview here instead.
import { PreviewShell } from "./_components/PreviewShell";
import { PrototypeSwitcher } from "./_components/PrototypeSwitcher";

export default async function PrototypeSidebarPage(
  props: PageProps<"/prototype-sidebar">,
) {
  const params = await props.searchParams;
  const raw =
    typeof params.variant === "string" ? params.variant.toUpperCase() : "A";
  const variant = raw === "B" || raw === "C" ? raw : "A";

  return (
    <>
      <PreviewShell variant={variant} />
      <PrototypeSwitcher current={variant} />
    </>
  );
}
