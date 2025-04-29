// /* eslint-disable camelcase */

// Interface DatabaseMocks {
// 	Run?<T>(): T[];
// 	First?<T>(): T;
// 	Batch?<T>(): T[][];
// 	All?<T>(): T[];
// }

// Interface KVMocks {
// 	Get?<T>(): T;
// 	List?<T>(): T[];
// }

// Interface MockConstructorParams {
// 	Database?: DatabaseMocks;
// 	Sessions?: KVMocks;
// 	Activations?: KVMocks;
// }

// Export class MockEnvBindings {
// 	Database = undefined as unknown as D1Database;
// 	Assets = undefined as unknown as Fetcher;
// 	SessionTokens = undefined as unknown as KVNamespace;
// 	ActivationTokens = undefined as unknown as KVNamespace;

// 	Constructor({ database, activations, sessions }: MockConstructorParams = {}) {
// 		This.setDatabase(database);
// 		This.setKV('ActivationTokens', activations);
// 		This.setKV('SessionTokens', sessions);
// 		This.setAssets();
// 	}

// 	SetDatabase({ run, first, batch, all }: DatabaseMocks = {}) {
// 		Const resultsBase: D1Response = {
// 			Success: true,
// 			Meta: {
// 				Duration: 0,
// 				Size_after: 0,
// 				Rows_read: 0,
// 				Rows_written: 0,
// 				Last_row_id: 0,
// 				Changed_db: true,
// 				Changes: 0
// 			}
// 		};

// 		Const preparedStatement: D1PreparedStatement = {
// 			Bind: (..._values: unknown[]) => preparedStatement,
// 			First: async (_colName?: string) => Promise.resolve(first?.() ?? null),
// 			Run: async () =>
// 				Promise.resolve({
// 					...resultsBase,
// 					Results: (run?.() ?? [])
// 				}),
// 			All: async () =>
// 				Promise.resolve({
// 					...resultsBase,
// 					Results: (all?.() ?? [])
// 				}),
// 			Raw: async (_options?: { columnNames?: boolean }) => Promise.resolve([[]])
// 		};

// 		This.Database = {
// 			Prepare: () => preparedStatement,
// 			Batch: async <T>() =>
// 				Promise.resolve(
// 					(batch?.() ?? []).map((result) => ({
// 						...resultsBase,
// 						Results: result as T[]
// 					}))
// 				),
// 			Exec: async () =>
// 				Promise.resolve({
// 					Count: 0,
// 					Duration: 0
// 				}),
// 			WithSession: () => ({
// 				Prepare: () => preparedStatement,
// 				Batch: async <T>() =>
// 					Promise.resolve(
// 						(batch?.() ?? []).map((result) => ({
// 							...resultsBase,
// 							Results: result as T[]
// 						}))
// 					),
// 				GetBookmark: () => null
// 			}),
// 			Dump: async () => Promise.resolve(new ArrayBuffer(0))
// 		};
// 	}

// 	SetKV(namespace: 'ActivationTokens' | 'SessionTokens', { get, list }: KVMocks = {}) {
// 		This[namespace] = {
// 			Get: async <T>() => Promise.resolve((get?.() ?? null) as T),
// 			// @ts-expect-error
// 			GetWithMetadata: async () =>
// 				Promise.resolve({
// 					Value: null,
// 					Metadata: null,
// 					CacheStatus: null
// 				}),
// 			List: async () =>
// 				Promise.resolve({
// 					List_complete: true,
// 					Keys: (list?.() ?? []),
// 					CacheStatus: null
// 				}),
// 			Put: async () => Promise.resolve(),
// 			Delete: async () => Promise.resolve()
// 		};
// 	}

// 	SetAssets() {
// 		Const socket: Socket = {
// 			Readable: new ReadableStream(),
// 			Writable: new WritableStream(),
// 			Closed: Promise.resolve(),
// 			Opened: Promise.resolve({}),
// 			Close: async () => Promise.resolve(),
// 			StartTls: () => socket
// 		};

// 		This.Assets = {
// 			Fetch: async () => Promise.resolve(new Response()),
// 			// @ts-expect-error
// 			Connect: async () => Promise.resolve(socket)
// 		};
// 	}
// }
