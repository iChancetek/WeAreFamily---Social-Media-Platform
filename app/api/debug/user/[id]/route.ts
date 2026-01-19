import { NextResponse } from 'next/server';
import { getUserAnalyticsSimple } from '@/app/actions/user-analytics';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const data = await getUserAnalyticsSimple(params.id);
        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Debug API error:', error);
        return NextResponse.json({ success: false, error: (error as any).message }, { status: 500 });
    }
}
