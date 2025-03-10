import type { Access } from './access';

export interface SessionData {
	id: string;
	email: string;
	access: Access;
	expiry: ISODate;
}
