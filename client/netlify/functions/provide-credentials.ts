import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

// TODO - REDO THIS, SO THAT THE AKI KEY IS NOT PLAIN IN SIGHT
export const handler: Handler = async (event: HandlerEvent, _: HandlerContext) => {
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method Not Allowed' }),
        };
    }

    const supabaseUrl = process.env['NG_APP_Supabase_URL'];
    const supabaseKey = process.env['NG_APP_Supabase_API_KEY'];

    const payload = JSON.stringify({ supabaseKey, supabaseUrl });

    return {
        statusCode: 200,
        body: btoa(payload),
    };
}
