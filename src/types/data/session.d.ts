import type { AuthorizationRole } from './role';

export interface Session {
	id: string;
	email: string;
	role: AuthorizationRole;
	expiry: string;
}
