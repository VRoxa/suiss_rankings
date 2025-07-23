import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { JwtPayload } from '@supabase/supabase-js';
import * as jwt from 'jsonwebtoken';

export const handler: Handler = async (event: HandlerEvent, _: HandlerContext) => {
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method Not Allowed' }),
        };
    }

    const jwtSecret = process.env['JWT_SECRET'];
    if (!jwtSecret) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Server configuration error' }),
        };
    }

    const authHeader = event.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
        return {
            statusCode: 401,
            body: JSON.stringify({ message: 'Authorization token required' }),
        };
    }

    const [, token] = authHeader.split(' ');
    try {
        const { role } = jwt.verify(token, jwtSecret) as JwtPayload;
        if (role !== 'admin') {
            return {
                statusCode: 403,
                body: JSON.stringify({ message: 'Forbidden: insufficient permissions' }),
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ status: 'valid' }),
        };
    }
    catch (error) {
        console.error('JWT verification error', error);
        return {
            statusCode: 401,
           body: JSON.stringify({ message: 'Unauthorized. Invalid or expired token' }),
        };
    }
}
