import { type Request, type Response, Router } from 'express';
import type { WalletService } from '../services/wallet/index.js';

export class WalletController {
	public readonly router: Router;

	constructor(private readonly walletService: WalletService) {
		this.router = Router();
		this.router.get('/:id', this.getBalance);
	}

	private getBalance = async (req: Request, res: Response) => {
		const walletId = req.params.id as string; // it's in the route
		const balance = await this.walletService.getBalance(walletId);

		return res.json({ balance });
	};
}
