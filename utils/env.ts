import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

export interface TestEnv {
    url: string,
    apiUrl: string,
    user: {
        username: string,
        password: string
    }
}

export const env: TestEnv = {
    url: process.env.URL ?? 'http://localhost:8080',
    apiUrl: process.env.API_URL ?? 'http://localhost:8080',
    user : {
        username: process.env.UI_USERNAME ?? '',
        password: process.env.UI_PASSWORD ?? ''
    }
}