import type { Name } from '../../routes/profile/validation.ts';
import type { Access } from './access.ts';

export interface Heartbeat {
	name: Name;
	avatar: string;
	access: Access;
}
