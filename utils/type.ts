export type TaskData = {
    id?: number
    name: string
    assignee: string
    description: string
    status: 'new' | 'in progress' | 'in testing' | 'done'
}