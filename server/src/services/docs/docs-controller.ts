import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { parse } from 'yaml';
import type { Controller } from '../../lib/controller.js';

export class DocsController implements Controller {
	public readonly router: Router;

	constructor() {
		this.router = Router();

		const openApiSpec = readFileSync(
			join(import.meta.dirname, '../../../openapi.yaml'),
			'utf-8',
		);
		const spec = parse(openApiSpec);

		this.router.use('/', swaggerUi.serve);
		this.router.get('/', swaggerUi.setup(spec));
	}
}
