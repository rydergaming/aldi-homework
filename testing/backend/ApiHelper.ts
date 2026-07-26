import {APIRequestContext, APIResponse, expect} from '@playwright/test'
import { TaskData } from '../../utils/type'
import {env} from '../../utils/env'

const basicAuth = Buffer.from(`${env.user.username}:${env.user.password}`).toString('base64')

const headerData = {
    'Authorization': `Basic ${basicAuth}`
}

const apiPath = '/api/v1'

export class ApiHelper {

    static async getRequest(request: APIRequestContext, taskId: number): Promise<APIResponse> {
        return await request.get(`${apiPath}/task/${taskId}`, {headers: headerData})
    }

    static async postRequest(request: APIRequestContext, data: TaskData): Promise<APIResponse> {
        return await request.post(`${apiPath}/task`, { headers: headerData, data: data})
    }

    static async putRequest(request: APIRequestContext, taskId: number, taskData: TaskData): Promise<APIResponse> {
        return await request.put(`${apiPath}/task/${taskId}`, { headers: headerData, data: taskData})
    }

    static async deleteRequest(request: APIRequestContext, taskId: number): Promise<APIResponse> {
        return await request.delete(`${apiPath}/task/${taskId}`, {headers: headerData})
    }

    /**
     * Creates a task and returns it's ID
     * @param request APIRequestContext to use
     * @param data TaskData to use
     */
    static async createTask(request: APIRequestContext, data: TaskData): Promise<number> {
        const postResponse = await this.postRequest(request, data)
        expect(postResponse.status()).toBe(200)
        const postBodyData = await postResponse.json()
        expect(postBodyData.id).toEqual(expect.any(Number))
        return postBodyData.id
    }
}
