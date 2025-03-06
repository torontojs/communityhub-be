import type { AuthorizationAccess } from './access';

export interface Session {
	id: string;
	email: string;
	access: AuthorizationAccess;
	expiry: ISODate;
}
