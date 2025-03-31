import { Access } from './access.ts'

export interface heartbeat{
	name:string,
	avatar: string,
	access: Access,
	isAuthenticated: boolean
}
