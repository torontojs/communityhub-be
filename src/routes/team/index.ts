import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { z } from 'zod';
import { DBTables } from '../../constants/db.ts';
import { authorizeAdmin, authorizeOrganizer, authorizeVolunteer } from '../../middleware/createMiddleware.ts';
import {
	type DataResponse,
	generateDataResponeSchema,
	generatePaginatedResponseSchema,
	type PaginatedResponse,
	StatusCodes,
	type StatusResponse,
	statusResponseFormatter,
	StatusResponseSchema
} from '../../utils/responses.ts';
import { IdParamSchema, validateExistingId } from '../../utils/validation.ts';
import { deleteTeamById, getAllTeams, getTeamById, insertTeam, updateTeamById } from './data.ts';
import { CreateTeamSchema, TeamSchema, UpdateTeamSchema } from './validation.ts';

export const publicTeamRoutes = new OpenAPIHono<EnvironmentBindings>({
	defaultHook: statusResponseFormatter
});

// GET team by ID
publicTeamRoutes.openapi(
	createRoute({
		method: 'get',
		path: '/{id}',
		operationId: 'getTeam',
		summary: 'Get team by ID',
		description: "Retrieves a single team based on it's id.",
		tags: ['Team'],
		request: {
			params: IdParamSchema
		},
		responses: {
			[StatusCodes.OKAY]: {
				description: 'Successful response',
				content: { 'application/json': { schema: generateDataResponeSchema(TeamSchema) } }
			},
			[StatusCodes.NOT_FOUND]: {
				description: 'Error response',
				content: { 'application/json': { schema: StatusResponseSchema } }
			}
		}
	}),
	async (context) => {
		const { id } = context.req.valid('param');

		const isTeamIdValid = await validateExistingId(context.env.database, DBTables.TEAM, id);

		if (!isTeamIdValid) {
			return context.json({ message: 'Team not found' } satisfies StatusResponse, StatusCodes.NOT_FOUND);
		}

		const team = await getTeamById(context.env.database, id);

		if (!team) {
			return context.json({ message: 'Team not found' } satisfies StatusResponse, StatusCodes.NOT_FOUND);
		}

		return context.json({ data: team, _links: { self: { href: context.req.url } } } satisfies DataResponse<typeof team>, StatusCodes.OKAY);
	}
);

// GET all teams
publicTeamRoutes.openapi(
	createRoute({
		method: 'get',
		path: '/',
		operationId: 'getTeams',
		summary: 'Get teams',
		description: 'Retrieves a list of teams',
		tags: ['Team'],
		responses: {
			[StatusCodes.OKAY]: {
				description: 'Successful response',
				content: { 'application/json': { schema: generatePaginatedResponseSchema(z.array(TeamSchema)) } }
			}
		},
		middleware: [authorizeVolunteer] as const
	}),
	async (context) => {
		const teams = await getAllTeams(context.env.database);

		return context.json(
			// TODO: implement proper pagination
			{
				data: teams,
				start: 0,
				end: teams.length - 1,
				total: teams.length,
				size: teams.length,
				currentPage: 1,
				lastPage: 1,
				_links: {
					self: { href: context.req.url },
					first: { href: context.req.url },
					last: { href: context.req.url }
				}
			} satisfies PaginatedResponse<typeof teams>,
			StatusCodes.OKAY
		);
	}
);

// Protected routes (POST, PATCH, DELETE)
export const protectedTeamRoutes = new OpenAPIHono<EnvironmentBindings>({
	defaultHook: statusResponseFormatter
});

// DELETE team by ID
protectedTeamRoutes.openapi(
	createRoute({
		method: 'delete',
		path: '/{id}',
		operationId: 'deleteTeam',
		summary: 'Delete team by ID',
		description: "Deletes a single team based on it's id",
		tags: ['Team'],
		request: {
			params: IdParamSchema
		},
		responses: {
			[StatusCodes.OKAY]: {
				description: 'Successful response',
				content: { 'application/json': { schema: StatusResponseSchema } }
			},
			[StatusCodes.NOT_FOUND]: {
				description: 'Error response',
				content: { 'application/json': { schema: StatusResponseSchema } }
			},
			[StatusCodes.INTERNAL_SERVER_ERROR]: {
				description: 'Server error response',
				content: { 'application/json': { schema: StatusResponseSchema } }
			}
		},
		middleware: [authorizeAdmin] as const
	}),
	async (context) => {
		const { id } = context.req.valid('param');

		const isTeamIdValid = await validateExistingId(context.env.database, DBTables.TEAM, id);

		if (!isTeamIdValid) {
			return context.json({ message: 'Team not found' } satisfies StatusResponse, StatusCodes.NOT_FOUND);
		}

		const isDeleted = await deleteTeamById(context.env.database, id);

		if (!isDeleted) {
			return context.json({ message: 'Team not deleted' } satisfies StatusResponse, StatusCodes.INTERNAL_SERVER_ERROR);
		}

		return context.json({ message: 'Team deleted successfully' } satisfies StatusResponse, StatusCodes.OKAY);
	}
);

// POST new team
protectedTeamRoutes.openapi(
	createRoute({
		method: 'post',
		path: '/',
		operationId: 'createNewTeam',
		summary: 'Create new team',
		description: 'Add a new team to the VMS including basic information about this team.',
		tags: ['Team'],
		request: {
			body: { content: { 'application/json': { schema: CreateTeamSchema } }, required: true }
		},
		responses: {
			[StatusCodes.CREATED]: {
				description: 'Successful response',
				content: { 'application/json': { schema: StatusResponseSchema } }
			},
			[StatusCodes.INTERNAL_SERVER_ERROR]: {
				description: 'Server Error response',
				content: { 'application/json': { schema: StatusResponseSchema } }
			}
		},
		middleware: [authorizeAdmin] as const
	}),
	async (context) => {
		const body = context.req.valid('json');
		const { success } = await insertTeam(context.env.database, body);

		if (!success) {
			return context.json({ message: 'Team not saved' } satisfies StatusResponse, StatusCodes.INTERNAL_SERVER_ERROR);
		}

		return context.json({ message: 'Team created successfully' } satisfies StatusResponse, StatusCodes.CREATED);
	}
);

// PATCH team by ID
protectedTeamRoutes.openapi(
	createRoute({
		method: 'patch',
		path: '/{id}',
		operationId: 'updateTeam',
		summary: 'Update existing team',
		description: "Update information for an existing team based on it's id.",
		tags: ['Team'],
		request: {
			body: { content: { 'application/json': { schema: UpdateTeamSchema } }, required: true },
			params: IdParamSchema
		},
		responses: {
			[StatusCodes.OKAY]: {
				description: 'Successful response',
				content: { 'application/json': { schema: StatusResponseSchema } }
			},
			[StatusCodes.NOT_FOUND]: {
				description: 'Error response',
				content: { 'application/json': { schema: StatusResponseSchema } }
			},
			[StatusCodes.INTERNAL_SERVER_ERROR]: {
				description: 'Server error response',
				content: { 'application/json': { schema: StatusResponseSchema } }
			}
		},
		middleware: [authorizeOrganizer] as const
	}),
	async (context) => {
		const { id } = context.req.valid('param');
		const body = context.req.valid('json');

		const isTeamIdValid = await validateExistingId(context.env.database, DBTables.TEAM, id);

		if (!isTeamIdValid) {
			return context.json({ message: 'Team not found' } satisfies StatusResponse, StatusCodes.NOT_FOUND);
		}

		const isUpdated = await updateTeamById(context.env.database, id, body);

		if (!isUpdated) {
			return context.json({ message: 'Team not updated' } satisfies StatusResponse, StatusCodes.INTERNAL_SERVER_ERROR);
		}

		return context.json({ message: 'Team updated successfully' } satisfies StatusResponse, StatusCodes.OKAY);
	}
);
