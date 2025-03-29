import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { authMiddleware } from 'src/middleware/auth.ts';
import { z } from 'zod';
import { DBTables } from '../../constants/db.ts';
import { canModifyProfile } from '../../middleware/canModifyProfile.ts';
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
import { deleteProfileById, getAllProfiles, getProfileById, insertProfile, updateProfileById, validateExistingEmail } from './data.ts';
import { CreateProfileSchema, ProfileSchema, UpdateProfileSchema } from './validation.ts';

// Public routes (GET only)
export const publicProfileRoutes = new OpenAPIHono<EnvironmentBindings>({
	defaultHook: statusResponseFormatter
});

// GET all profiles
publicProfileRoutes.openapi(
	createRoute({
		method: 'get',
		path: '/',
		operationId: 'getProfiles',
		summary: 'Get profiles',
		description: 'Retrieves a list of profiles',
		tags: ['Profile'],
		responses: {
			[StatusCodes.OKAY]: {
				description: 'Successful response',
				content: { 'application/json': { schema: generatePaginatedResponseSchema(z.array(ProfileSchema)) } }
			}
		}
	}),
	async (context) => {
		const profiles = await getAllProfiles(context.env.database);

		return context.json(
			{
				data: profiles,
				start: 0,
				end: profiles.length - 1,
				total: profiles.length,
				size: profiles.length,
				currentPage: 1,
				lastPage: 1,
				_links: {
					self: { href: context.req.url },
					first: { href: context.req.url },
					last: { href: context.req.url }
				}
			} satisfies PaginatedResponse<typeof profiles>,
			StatusCodes.OKAY
		);
	}
);

// GET profile by ID
publicProfileRoutes.openapi(
	createRoute({
		method: 'get',
		path: '/{id}',
		operationId: 'getProfile',
		summary: 'Get profile by ID',
		description: "Retrieves a single profile based on it's id.",
		tags: ['Profile'],
		request: {
			params: IdParamSchema
		},
		responses: {
			[StatusCodes.OKAY]: {
				description: 'Successful response',
				content: { 'application/json': { schema: generateDataResponeSchema(ProfileSchema) } }
			},
			[StatusCodes.NOT_FOUND]: {
				description: 'Error response',
				content: { 'application/json': { schema: StatusResponseSchema } }
			}
		}
	}),
	async (context) => {
		const { id } = context.req.valid('param');

		const profile = await getProfileById(context.env.database, id);

		if (!profile) {
			return context.json({ message: 'Profile not found' } satisfies StatusResponse, StatusCodes.NOT_FOUND);
		}

		return context.json({ data: profile, _links: { self: { href: context.req.url } } } satisfies DataResponse<typeof profile>, StatusCodes.OKAY);
	}
);

// Protected routes (POST, PATCH, DELETE)
export const protectedProfileRoutes = new OpenAPIHono<EnvironmentBindings>({
	defaultHook: statusResponseFormatter
});

// POST new profile
protectedProfileRoutes.openapi(
	createRoute({
		method: 'post',
		path: '/',
		operationId: 'createNewProfile',
		summary: 'Create new profile',
		description: 'Add a new profile to the VMS including basic information about this person.',
		tags: ['Profile'],
		request: {
			body: { content: { 'application/json': { schema: CreateProfileSchema } }, required: true }
		},
		responses: {
			[StatusCodes.CREATED]: {
				description: 'Successful response',
				content: { 'application/json': { schema: StatusResponseSchema } }
			},
			[StatusCodes.BAD_REQUEST]: {
				description: 'Error response',
				content: { 'application/json': { schema: StatusResponseSchema } }
			},
			[StatusCodes.INTERNAL_SERVER_ERROR]: {
				description: 'Server Error response',
				content: { 'application/json': { schema: StatusResponseSchema } }
			}
		},
		middleware: [authMiddleware, authMiddleware, authorizeOrganizer] as const
	}),
	async (context) => {
		const body = context.req.valid('json');

		const isEmailExisting = await validateExistingEmail(context.env.database, body.email);

		if (isEmailExisting) {
			return context.json({ message: 'Email already exists' } satisfies StatusResponse, StatusCodes.BAD_REQUEST);
		}

		const { success } = await insertProfile(context.env.database, body);

		if (!success) {
			return context.json({ message: 'Profile not created' } satisfies StatusResponse, StatusCodes.INTERNAL_SERVER_ERROR);
		}

		return context.json({ message: 'Profile created successfully' } satisfies StatusResponse, StatusCodes.CREATED);
	}
);

// PATCH profile
protectedProfileRoutes.openapi(
	createRoute({
		method: 'patch',
		path: '/{id}',
		operationId: 'updateProfile',
		summary: 'Update existing profile',
		description: "Update information for an existing profile based on it's id.",
		tags: ['Profile'],
		request: {
			body: { content: { 'application/json': { schema: UpdateProfileSchema } }, required: true },
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
				description: 'Server Error response',
				content: { 'application/json': { schema: StatusResponseSchema } }
			}
		},
		middleware: [authMiddleware, authorizeVolunteer, canModifyProfile] as const
	}),
	async (context) => {
		const { id } = context.req.valid('param');
		const body = context.req.valid('json');

		const isProfileIdValid = await validateExistingId(context.env.database, DBTables.PROFILE, id);

		if (!isProfileIdValid) {
			return context.json({ message: 'Profile not found' } satisfies StatusResponse, StatusCodes.NOT_FOUND);
		}

		const isUpdated = await updateProfileById(context.env.database, id, body);

		if (!isUpdated) {
			return context.json({ message: 'Profile not updated' } satisfies StatusResponse, StatusCodes.INTERNAL_SERVER_ERROR);
		}

		return context.json({ message: 'Profile updated successfully' } satisfies StatusResponse, StatusCodes.OKAY);
	}
);

// DELETE profile
protectedProfileRoutes.openapi(
	createRoute({
		method: 'delete',
		path: '/{id}',
		operationId: 'deleteProfile',
		summary: 'Delete profile by ID',
		description: "Deletes a single profile based on it's id",
		tags: ['Profile'],
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
				description: 'Server Error response',
				content: { 'application/json': { schema: StatusResponseSchema } }
			}
		},
		middleware: [authMiddleware, authorizeAdmin] as const
	}),
	async (context) => {
		const { id } = context.req.valid('param');

		const isProfileIdValid = await validateExistingId(context.env.database, DBTables.PROFILE, id);

		if (!isProfileIdValid) {
			return context.json({ message: 'Profile not found' } satisfies StatusResponse, StatusCodes.NOT_FOUND);
		}

		const isDeleted = await deleteProfileById(context.env.database, id);

		if (!isDeleted) {
			return context.json({ message: 'Profile not deleted' } satisfies StatusResponse, StatusCodes.INTERNAL_SERVER_ERROR);
		}

		return context.json({ message: 'Profile deleted successfully' } satisfies StatusResponse, StatusCodes.OKAY);
	}
);
