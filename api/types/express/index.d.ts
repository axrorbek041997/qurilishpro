declare namespace Express {
  interface Request {
    user?: {
      userId: string
      email: string
      role: string
    }
    token: string
    file: {
      originalname: string
      extension: string
      filename: string
      size: number
      mimetype: string
      path: string
    }
  }
}
