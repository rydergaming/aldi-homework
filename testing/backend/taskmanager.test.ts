import {test, expect} from '@playwright/test'
import { TaskData } from '../../utils/type'
import { ApiHelper } from './ApiHelper'



const createData: TaskData = {
    name: 'New task',
    assignee: 'John Doe',
    description: 'This is the newest task',
    status: 'new'
}

const updatedData: TaskData = {
    name: 'New task',
    assignee: 'Jane Doe',
    description: 'The task is now updated',
    status: 'in progress'
}


test.describe('API tests',() => {

    test('Create Task', async({request})=> {
        const response = await ApiHelper.postRequest(request, createData)
        expect(response.status()).toBe(200)
        const bodyData = await response.json()
        expect(bodyData).toMatchObject(createData)
    })

    test('Get Task', async({request}) => {
        const taskId = await ApiHelper.createTask(request, createData)        

        const response = await ApiHelper.getRequest(request, taskId)
        expect(response.status()).toBe(200)
        const bodyData = await response.json()
        expect(bodyData).toMatchObject(createData)
    })

    test('Update Task', async({request}) => {
        const taskId = await ApiHelper.createTask(request, createData)

        const response = await ApiHelper.putRequest(request, taskId, updatedData)
        expect(response.status()).toBe(200)
        const bodyData = await response.json()        
        expect(bodyData).toMatchObject(updatedData)
    })

    test('Delete Task', async({request}) => {
        const taskId = await ApiHelper.createTask(request, createData)

        const response = await ApiHelper.deleteRequest(request, taskId)
        expect(response.status()).toBe(200)
        const responseBody = await response.json()
        expect(responseBody.id).toBe(taskId)

        const getResponse = await ApiHelper.getRequest(request, taskId)
        expect(getResponse.status()).toBe(404)
    })
    
})