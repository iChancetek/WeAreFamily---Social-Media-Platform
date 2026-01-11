
/**
 * Smartly resolves a user's display name from various profile fields.
 * Prioritizes custom display names, then real names, then email usernames.
 * Explicitly rejects generic placeholders like "Family Member".
 */
export function resolveDisplayName(data: any): string {
    if (!data) return "Unknown User";

    // 1. Use displayName if it exists and is meaningful (not generic/default)
    if (data.displayName && data.displayName.trim()) {
        const lowerName = data.displayName.toLowerCase();
        const generics = ["family member", "unknown user", "member", "user", "guest"];

        // Only use if NOT generic
        if (!generics.includes(lowerName)) {
            return data.displayName;
        }
    }

    // 2. Try to build from profile data
    if (data.profileData?.firstName) {
        const fullName = `${data.profileData.firstName} ${data.profileData.lastName || ''}`.trim();
        if (fullName) return fullName;
    }

    // 2b. Fallback: If we have first/last name at top level (sometimes happens in legacy data)
    if (data.firstName) {
        const fullName = `${data.firstName} ${data.lastName || ''}`.trim();
        if (fullName) return fullName;
    }

    // 3. Fallback: Unnamed User (Strict mode: No email fallback)
    return "Unnamed User";
}
