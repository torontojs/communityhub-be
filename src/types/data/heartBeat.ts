import type { Access } from './access.ts';

export interface Heartbeat {
	name: string;
	avatar: string;
	access: Access;
}
