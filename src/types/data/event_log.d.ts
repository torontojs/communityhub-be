export type LogItemSource = 'profile' | 'role' | 'special' | 'team';

export interface EventLog {
	id: string;
	schemaVersion: number;
	subject: string;
	subjectSource: LogItemSource;
	verb: string;
	object: string;
	objectSource: LogItemSource;
	happenedAt: Date;
	insertedAt: Date;
}
