import { AuthService } from '../services/auth/auth.service.js';

export const syncUser = async (req: any, res: any) => {
  try {
    const { id, name, email } = req.body;
    
    // Auth service handles the DB upsert
    const user = await AuthService.syncUser(id, name, email);

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    console.error('Error syncing user:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to sync user',
      error: error.message,
    });
  }
};
