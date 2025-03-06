export interface Role {
	id: string;
	schemaVersion: number;
	role: string;
	description?: string;
	teamId: string;
	profileId: string;
	happenedAt: Date;
	insertedAt: Date;
}
