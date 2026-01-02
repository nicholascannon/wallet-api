import {
	type ErrorRequestHandler,
	type Request,
	type Response,
	Router,
} from 'express';
import * as z from 'zod';
import type { Controller } from '../../lib/controller.js';
import { LOGGER } from '../../lib/logger.js';
import {
	InsufficientFundsError,
	InvalidDebitAmountError,
	WalletNotFoundError,
} from './wallet-errors.js';
import type { WalletService } from './wallet-service.js';

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
			return res.status(400).json({
				message: error.message,
				error: 'INSUFFICIENT_FUNDS',
				availableBalance: error.availableBalance.toFixed(2),
				requestedAmount: error.requestedAmount.toFixed(2),
			});
		}
		if (error instanceof InvalidDebitAmountError) {
			return res.status(400).json({
				message: error.message,
				error: 'INVALID_DEBIT_AMOUNT',
				amount: error.amount.toFixed(2),
			});
		}
		if (error instanceof WalletNotFoundError) {
			return res.status(404).json({
				message: error.message,
				error: 'WALLET_NOT_FOUND',
				walletId: error.walletId,
			});
		}

		return next(error);
	};

	private readonly getWalletSchema = z.uuid();

	private getWallet = async (req: Request, res: Response) => {
		const walletId = this.getWalletSchema.parse(req.params.id);
		const wallet = await this.walletService.getWallet(walletId);

		return res.json({
			id: wallet.id,
			balance: wallet.balance.toFixed(2),
			updated: wallet.updated,
		});
	};

	private readonly debitSchema = z.object({
		walletId: z.uuid(),
		amount: z.number().min(0.01),
		metadata: z
			.record(
				z.string(),
				z.union([z.string(), z.number(), z.boolean(), z.null(), z.undefined()]),
			)
			.optional(),
	});

	private debit = async (req: Request, res: Response) => {
		const { walletId, amount, metadata } = this.debitSchema.parse({
			walletId: req.params.id,
			amount: req.body.amount,
			metadata: req.body.metadata,
		});

		const { balance, transactionId } = await this.walletService.debit(
			walletId,
			amount,
			{
				requestId: req.requestId,
				source: req.source,
				...metadata,
			},
		);

		LOGGER.info('DEBIT', {
			walletId,
			transactionId,
			amount,
			requestId: req.requestId,
			ip: req.ip,
		});

		return res.status(200).json({
			balance: balance.toFixed(2),
			requestId: req.requestId,
			transactionId,
		});
	};

	private readonly creditSchema = z.object({
		walletId: z.uuid(),
		amount: z.number().min(0.01),
		metadata: z
			.record(
				z.string(),
				z.union([z.string(), z.number(), z.boolean(), z.null(), z.undefined()]),
			)
			.optional(),
	});

	private credit = async (req: Request, res: Response) => {
		const { walletId, amount, metadata } = this.creditSchema.parse({
			walletId: req.params.id,
			amount: req.body.amount,
			metadata: req.body.metadata,
		});

		const { transaction, created } = await this.walletService.credit(
			walletId,
			amount,
			{
				requestId: req.requestId,
				source: req.source,
				...metadata,
			},
		);

		if (created) {
			LOGGER.info('CREDIT - NEW WALLET', {
				walletId,
				transactionId: transaction.transactionId,
				amount,
				requestId: req.requestId,
				ip: req.ip,
			});
		} else {
			LOGGER.info('CREDIT', {
				walletId,
				transactionId: transaction.transactionId,
				amount,
				requestId: req.requestId,
				ip: req.ip,
			});
		}

		return res.status(created ? 201 : 200).json({
			balance: transaction.balance.toFixed(2),
			requestId: req.requestId,
			transactionId: transaction.transactionId,
		});
	};
}
