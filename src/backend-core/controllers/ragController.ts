import { Request, Response, NextFunction } from 'express';

export const ragController = {
  queryKnowledgeArticles: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json({ success: true, results: [] });
    } catch (err) {
      next(err);
    }
  }
};
