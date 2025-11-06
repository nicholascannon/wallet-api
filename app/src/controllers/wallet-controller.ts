import {
	type ErrorRequestHandler,
	type Request,
	type Response,
	Router,
} from 'express';
import * as z from 'zod';
import {
	InsufficientFundsError,
	InvalidDebitAmountError,
	WalletNotFoundError,
} from '../services/wallet/errors.js';
import type { WalletService } from '../services/wallet/wallet-service.js';
import type { Controller } from './controller.js';

export class WalletController implements Controller {
	public readonly router: Router;

	constructor(private readonly walletService: WalletService) {
		this.router = Router();
		this.router.get('/:id', this.getWallet);
		this.router.post('/:id/debit', this.debit);
		this.router.post('/:id/credit', this.credit);
		this.router.use(this.errorHandler);
	}

	private errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
		if (error instanceof InsufficientFundsError) {
			return res.status(400).json({ message: error.message });
		}
		if (error instanceof InvalidDebitAmountError) {
			return res.status(400).json({ message: error.message });
		}
		if (error instanceof WalletNotFoundError) {
			return res.status(404).json({ message: error.message });
		}

		return next(error);
	};

	private readonly getWalletSchema = z.uuid();

	private getWallet = async (req: Request, res: Response) => {
		const walletId = this.getWalletSchema.parse(req.params.id);
		const wallet = await this.walletService.getWallet(walletId);

		return res.json(wallet);
	};

	private readonly debitSchema = z.object({
		walletId: z.uuid(),
		amount: z.number().min(0.01),
	});

	private debit = async (req: Request, res: Response) => {
		const { walletId, amount } = this.debitSchema.parse({
			walletId: req.params.id,
			amount: req.body.amount,
		});

		const { balance } = await this.walletService.debit(walletId, amount);

		return res.status(200).json({ balance });
	};

	private readonly creditSchema = z.object({
		walletId: z.uuid(),
		amount: z.number().min(0.01),
	});

	private credit = async (req: Request, res: Response) => {
		const { walletId, amount } = this.creditSchema.parse({
			walletId: req.params.id,
			amount: req.body.amount,
		});

		const { transaction, created } = await this.walletService.credit(
			walletId,
			amount,
		);

		return res
			.status(created ? 201 : 200)
			.json({ balance: transaction.balance });
	};
}
