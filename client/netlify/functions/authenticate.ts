import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import * as jwt from 'jsonwebtoken';


const ADMIN_VAR_NAME = "NETLIFY_ADMIN_PASSWORD";

export const handler: Handler = async (event: HandlerEvent, _: HandlerContext) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method Not Allowed' }),
        };
    }

    const { password } = JSON.parse(event.body!);
    const adminPassword = process.env[ADMIN_VAR_NAME];
    const jwtSecret = process.env['JWT_SECRET'];

    if (!adminPassword || !jwtSecret) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Server configuration error' }),
        };
    }

    if (password !== adminPassword) {
        return {
            statusCode: 401,
            body: JSON.stringify({ message: 'Invalid credentials' }),
        };
    }

    const token = jwt.sign({ role: 'admin', userId: 'backdoor' }, jwtSecret, {
        expiresIn: '1d'
    });

    return {
        statusCode: 200,
        body: JSON.stringify({ token }),
    };
}
