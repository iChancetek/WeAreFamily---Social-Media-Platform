export const dynamic = 'force-dynamic';

import { getBrandings } from "@/app/actions/branding";
import { BrandingView } from "@/components/branding/branding-view";

export default async function BrandingPage() {
    const brandings = await getBrandings();

    return <BrandingView brandings={brandings} />;
}
