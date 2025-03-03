import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { z } from 'zod';
import { DBTables } from '../../constants/db.ts';
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
import { deleteRoleById, getAllRoles, getRoleById, insertRole, updateRoleById } from './data.ts';
import { CreateRoleSchema, RoleSchema, UpdateRoleSchema } from './validation.ts';

export const roleRoutes = new OpenAPIHono<EnvironmentBindings>({
	defaultHook: statusResponseFormatter
});

roleRoutes.openapi(
	createRoute({
		method: 'post',
		path: '/',
		operationId: 'createNewRole',
		summary: 'Create new role',
		description: 'Add a new role to the VMS including basic information about this role.',
		tags: ['Role'],
		request: {
			body: { content: { 'application/json': { schema: CreateRoleSchema } }, required: true }
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
		}
	}),
	async (context) => {
		const body = context.req.valid('json');
		const { success } = await insertRole(context.env.database, body);

		if (!success) {
			return context.json({ message: 'Role not saved' } satisfies StatusResponse, StatusCodes.INTERNAL_SERVER_ERROR);
		}

		return context.json({ message: 'Role created successfully' } satisfies StatusResponse, StatusCodes.CREATED);
	}
);

roleRoutes.openapi(
	createRoute({
		method: 'patch',
		path: '/{id}',
		operationId: 'updateRole',
		summary: 'Update existing role',
		description: "Update information for an existing role based on it's id.",
		tags: ['Role'],
		request: {
			body: { content: { 'application/json': { schema: UpdateRoleSchema } }, required: true },
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
		}
	}),
	async (context) => {
		const { id } = context.req.valid('param');
		const body = context.req.valid('json');

		const isRoleIdValid = await validateExistingId(context.env.database, DBTables.ROLE, id);

		if (!isRoleIdValid) {
			return context.json({ message: 'Role not found' } satisfies StatusResponse, StatusCodes.NOT_FOUND);
		}

		const isUpdated = await updateRoleById(context.env.database, id, body);

		if (!isUpdated) {
			return context.json({ message: 'Role not updated' } satisfies StatusResponse, StatusCodes.INTERNAL_SERVER_ERROR);
		}

		return context.json({ message: 'Role updated successfully' } satisfies StatusResponse, StatusCodes.OKAY);
	}
);

roleRoutes.openapi(
	createRoute({
		method: 'get',
		path: '/{id}',
		operationId: 'getRole',
		summary: 'Get role by ID',
		description: "Retrieves a single role based on it's id.",
		tags: ['Role'],
		request: {
			params: IdParamSchema
		},
		responses: {
			[StatusCodes.OKAY]: {
				description: 'Successful response',
				content: { 'application/json': { schema: generateDataResponeSchema(RoleSchema) } }
			},
			[StatusCodes.NOT_FOUND]: {
				description: 'Error response',
				content: { 'application/json': { schema: StatusResponseSchema } }
			}
		}
	}),
	async (context) => {
		const { id } = context.req.valid('param');

		const isRoleIdValid = await validateExistingId(context.env.database, DBTables.ROLE, id);

		if (!isRoleIdValid) {
			return context.json({ message: 'Role not found' } satisfies StatusResponse, StatusCodes.NOT_FOUND);
		}

		const role = await getRoleById(context.env.database, id);

		if (!role) {
			return context.json({ message: 'Role not found' } satisfies StatusResponse, StatusCodes.NOT_FOUND);
		}

		return context.json({ data: role, _links: { self: { href: context.req.url } } } satisfies DataResponse<typeof role>, StatusCodes.OKAY);
	}
);

roleRoutes.openapi(
	createRoute({
		method: 'get',
		path: '/',
		operationId: 'getRoles',
		summary: 'Get roles',
		description: 'Retrieves a list of roles',
		tags: ['Role'],
		responses: {
			[StatusCodes.OKAY]: {
				description: 'Successful response',
				content: { 'application/json': { schema: generatePaginatedResponseSchema(z.array(RoleSchema)) } }
			}
		}
	}),
	async (context) => {
		const roles = await getAllRoles(context.env.database);

		return context.json(
			// TODO: implement proper pagination
			{
				data: roles,
				start: 0,
				end: roles.length - 1,
				total: roles.length,
				size: roles.length,
				currentPage: 1,
				lastPage: 1,
				_links: {
					self: { href: context.req.url },
					first: { href: context.req.url },
					last: { href: context.req.url }
				}
			} satisfies PaginatedResponse<typeof roles>,
			StatusCodes.OKAY
		);
	}
);

roleRoutes.openapi(
	createRoute({
		method: 'delete',
		path: '/{id}',
		operationId: 'deleteRole',
		summary: 'Delete role by ID',
		description: "Deletes a single role based on it's id",
		tags: ['Role'],
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
		}
	}),
	async (context) => {
		const { id } = context.req.valid('param');

		const isRoleIdValid = await validateExistingId(context.env.database, DBTables.ROLE, id);

		if (!isRoleIdValid) {
			return context.json({ message: 'Role not found' } satisfies StatusResponse, StatusCodes.NOT_FOUND);
		}

		const isDeleted = await deleteRoleById(context.env.database, id);

		if (!isDeleted) {
			return context.json({ message: 'Role not deleted' } satisfies StatusResponse, StatusCodes.INTERNAL_SERVER_ERROR);
		}

		return context.json({ message: 'Role deleted successfully' } satisfies StatusResponse, StatusCodes.OKAY);
	}
);
