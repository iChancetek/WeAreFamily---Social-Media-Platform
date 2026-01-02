export const dynamic = 'force-dynamic';
import { SignIn } from "@clerk/nextjs";

export default function Page() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-rose-50">
            <SignIn />
        </div>
    );
}
