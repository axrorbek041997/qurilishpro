import multer from 'multer';
import * as path from 'node:path';
import * as fs from 'node:fs';
import {env} from '../config/env';

type MulterOptions = multer.Options

const storage = (opts: MulterOptions) =>
    multer.diskStorage({
        destination: async (req, file, cb) => {
            const uploadDir = opts.dest || env.FILES_DIR || '/tmp';

            try {
                await fs.promises.mkdir(uploadDir, {recursive: true});
                cb(null, uploadDir);
            } catch (err) {
                cb(err as Error, uploadDir);
            }
        },
        filename: async (req, file, cb) => {
            // Keeps original extension, e.g. ".png"
            const ext = path.extname(file.originalname).toLowerCase();
            let unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

            cb(null, `${unique}${ext}`);
        },
    });

export const uploads = (opts: MulterOptions = {}) => {
    opts.storage = storage(opts);
    return multer(opts);
};
