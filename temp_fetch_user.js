import { getUserAnalyticsSimple } from './app/actions/user-analytics';

(async () => {
    const userId = 'zKCoQ0Si5ZfZAnDtNYTKFzwWJPs2';
    try {
        const data = await getUserAnalyticsSimple(userId);
        console.log('Result:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Error fetching analytics:', e);
    }
})();
