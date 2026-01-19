import { NextResponse, NextRequest } from 'next/server';
import { getUserAnalyticsSimple } from '@/app/actions/user-analytics';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const data = await getUserAnalyticsSimple(id);
        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Debug API error:', error);
        return NextResponse.json({ success: false, error: (error as any).message }, { status: 500 });
    }
}
