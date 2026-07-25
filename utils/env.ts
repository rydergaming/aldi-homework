import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

export interface TestEnv {
    uiUrl: string,
    user: {
        username: string,
        password: string
    }
}

export const env: TestEnv = {
    uiUrl: process.env.UI_URL ?? 'http://localhost:8080',
    user : {
        username: process.env.UI_USERNAME ?? '',
        password: process.env.UI_PASSWORD ?? ''
    }
}