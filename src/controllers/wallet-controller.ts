import { Router, type Request, type Response } from 'express';

export class WalletController {
  public readonly router: Router;

  constructor() {
    this.router = Router();
    this.router.get('/:id', this.getWallet);
  }

  private getWallet = (req: Request, res: Response): Response => {
    return res.json({
      id: req.params.id,
      balance: 100,
    });
  };
}
